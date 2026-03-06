import dotenv from 'dotenv'
import path from 'path'

// Load .env from project root (monorepo root, not package directory)
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') })

export const config = {
	databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:password@localhost:5433/geo',
	ingestPort: Number(process.env.INGEST_PORT ?? 3001),
	apiPort: Number(process.env.API_PORT ?? 3002),
	spaceId: process.env.SPACE_ID ?? '',
	pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 1000),
	batchSize: Number(process.env.BATCH_SIZE ?? 10),
	logLevel: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
} as const
