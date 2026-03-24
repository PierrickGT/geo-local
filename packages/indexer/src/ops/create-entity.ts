import { idToHex } from '@geo-runtime/shared'
import type { CreateEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { upsertTriple } from './shared.js'

export async function createEntity(client: pg.PoolClient, op: CreateEntity): Promise<void> {
	const id = idToHex(op.id)

	await client.query(
		`INSERT INTO entities (id) VALUES ($1)
		 ON CONFLICT (id) DO UPDATE SET status = 'alive', updated_at = now()`,
		[id],
	)

	for (const pv of op.values) {
		await upsertTriple(client, id, pv)
	}
}
