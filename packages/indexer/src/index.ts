import { closePool, config, createLogger, getPool } from '@geo-local/shared'
import { pollOnce } from './poller.js'

const log = createLogger('indexer')

let running = true

async function main(): Promise<void> {
	const pool = getPool()

	log.info(
		{ pollIntervalMs: config.pollIntervalMs, batchSize: config.batchSize },
		'indexer started',
	)

	while (running) {
		try {
			const count = await pollOnce(pool, config.batchSize)

			if (count > 0) {
				log.debug({ count }, 'processed edits')
			}
		} catch (err) {
			log.error({ err }, 'poll cycle error')
		}

		if (running) {
			await sleep(config.pollIntervalMs)
		}
	}

	log.info('indexer shutting down')
	await closePool()
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function shutdown(): void {
	log.info('received shutdown signal')
	running = false
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main().catch((err) => {
	log.fatal({ err }, 'indexer crashed')
	process.exit(1)
})
