import { closePool, config, createLogger } from '@geo-runtime/shared'
import express from 'express'
import { createRouter } from './routes.js'

const log = createLogger('api')
const app = express()

app.use(express.json())
app.use('/api', createRouter())

const server = app.listen(config.apiPort, () => {
	log.info({ port: config.apiPort }, 'API server started')
})

function shutdown() {
	log.info('Shutting down…')
	server.close(async () => {
		await closePool()
		process.exit(0)
	})
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
