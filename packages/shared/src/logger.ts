import pino from 'pino'
import { config } from './config.js'

export function createLogger(name: string) {
	return pino({ name, level: config.logLevel })
}
