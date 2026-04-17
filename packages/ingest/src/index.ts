import { closePool, config, createLogger } from '@geo-local/shared'
import express from 'express'
import { createRouter } from './routes.js'

const log = createLogger('ingest')

const app = express()
app.use('/edits', createRouter())

const server = app.listen(config.ingestPort, () => {
	log.info({ port: config.ingestPort }, 'Ingest server started')
})

function shutdown() {
	log.info('Shutting down...')
	server.close(async () => {
		await closePool()
		log.info('Shutdown complete')
		process.exit(0)
	})
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
