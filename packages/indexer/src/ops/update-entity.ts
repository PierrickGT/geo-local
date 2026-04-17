import { idToHex } from '@geo-local/shared'
import type { UpdateEntity } from '@geoprotocol/grc-20'
import { formatId, languages } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { upsertTriple } from './shared.js'

const ENGLISH_LANGUAGE_ID = idToHex(languages.english())

export async function updateEntity(
	client: pg.PoolClient,
	op: UpdateEntity,
	spaceId?: string,
): Promise<void> {
	const id = idToHex(op.id)

	// Backfill space_id if missing
	if (spaceId) {
		await client.query('UPDATE entities SET space_id = COALESCE(space_id, $2) WHERE id = $1', [
			id,
			spaceId,
		])
	}

	// 1. Process unsets first
	for (const u of op.unset) {
		const propId = idToHex(u.property)

		switch (u.language.type) {
			case 'all':
				await client.query('DELETE FROM triples WHERE entity_id = $1 AND property_id = $2', [
					id,
					propId,
				])
				break
			case 'english':
				await client.query(
					'DELETE FROM triples WHERE entity_id = $1 AND property_id = $2 AND language = $3',
					[id, propId, ENGLISH_LANGUAGE_ID],
				)
				break
			case 'specific':
				await client.query(
					'DELETE FROM triples WHERE entity_id = $1 AND property_id = $2 AND language = $3',
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
	await client.query('UPDATE entities SET updated_at = now() WHERE id = $1', [id])
}
