import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLogger } from '../logger.js'
import { closePool, getPool } from './pool.js'

const log = createLogger('migrate')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations')

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
		.filter((f) => f.endsWith('.sql'))
		.sort()

	for (const file of files) {
		const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file])
		if (rows.length > 0) {
			log.debug({ file }, 'Already applied')
			continue
		}

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
