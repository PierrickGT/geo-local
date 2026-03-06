import type pg from 'pg'
import type { UpdateEntity } from '@geoprotocol/grc-20'
import { idToHex } from '@geo-runtime/shared'
import { formatId } from '@geoprotocol/grc-20'
import { upsertTriple } from './shared.js'

export async function updateEntity(client: pg.PoolClient, op: UpdateEntity): Promise<void> {
	const id = idToHex(op.id)

	// 1. Process unsets first
	for (const u of op.unset) {
		const propId = idToHex(u.property)

		switch (u.language.type) {
			case 'all':
				await client.query(
					`DELETE FROM triples WHERE entity_id = $1 AND property_id = $2`,
					[id, propId],
				)
				break
			case 'english':
				await client.query(
					`DELETE FROM triples WHERE entity_id = $1 AND property_id = $2 AND language = ''`,
					[id, propId],
				)
				break
			case 'specific':
				await client.query(
					`DELETE FROM triples WHERE entity_id = $1 AND property_id = $2 AND language = $3`,
					[id, propId, formatId(u.language.language)],
				)
				break
		}
	}

	// 2. Upsert set values
	for (const pv of op.set) {
		await upsertTriple(client, id, pv)
	}

	// 3. Touch entity
	await client.query(
		`UPDATE entities SET updated_at = now() WHERE id = $1`,
		[id],
	)
}
