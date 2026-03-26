import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLogger } from '../logger.js'
import { closePool, getPool } from './pool.js'

const log = createLogger('migrate')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations')

interface MigrationEntry {
	run: () => Promise<void>
}

export async function runMigrations(): Promise<void> {
	const pool = getPool()

	// Ensure migrations tracking table exists
	await pool.query(`
		CREATE TABLE IF NOT EXISTS _migrations (
			name text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)
	`)

	// Find SQL files in build output or source
	let migrationsDir = MIGRATIONS_DIR
	if (!fs.existsSync(migrationsDir)) {
		// Fallback: resolve from source (for tsx usage)
		migrationsDir = path.resolve(__dirname, 'migrations')
	}

	if (!fs.existsSync(migrationsDir)) {
		log.warn({ dir: migrationsDir }, 'No migrations directory found')
		return
	}

	const files = fs
		.readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql') || f.endsWith('.ts'))
		.sort()

	for (const file of files) {
		const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file])
		if (rows.length > 0) {
			log.debug({ file }, 'Already applied')
			continue
		}

		if (file.endsWith('.sql')) {
			const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
			const client = await pool.connect()
			try {
				await client.query('BEGIN')
				await client.query(sql)
				await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
				await client.query('COMMIT')
				log.info({ file }, 'Migration applied')
			} catch (err) {
				await client.query('ROLLBACK')
				log.error({ file, err }, 'Migration failed')
				throw err
			} finally {
				client.release()
			}
		} else if (file.endsWith('.ts')) {
			// .ts migrations are dynamically imported and must export a `run()` function
			const mod = (await import(path.join(migrationsDir, file))) as MigrationEntry
			if (typeof mod.run !== 'function') {
				throw new Error(`TypeScript migration ${file} must export a run() function`)
			}
			try {
				await mod.run()
				await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
				log.info({ file }, 'Migration applied')
			} catch (err) {
				log.error({ file, err }, 'Migration failed')
				throw err
			}
		}
	}
}

// CLI entry point
const isMain =
	process.argv[1] &&
	(process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))
if (isMain) {
	runMigrations()
		.then(() => {
			log.info('All migrations applied')
			return closePool()
		})
		.catch((err) => {
			log.error(err, 'Migration failed')
			process.exit(1)
		})
}
