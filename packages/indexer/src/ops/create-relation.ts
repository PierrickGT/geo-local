import { idToHex } from '@geo-runtime/shared'
import type { CreateRelation } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { ensureEntity } from './shared.js'

export async function createRelation(client: pg.PoolClient, op: CreateRelation): Promise<void> {
	const id = idToHex(op.id)
	const fromId = idToHex(op.from)
	const toId = idToHex(op.to)

	// Auto-create referenced entities if missing
	await ensureEntity(client, fromId)
	await ensureEntity(client, toId)

	const entityId = op.entity ? idToHex(op.entity) : null

	await client.query(
		`INSERT INTO relations (id, relation_type, from_id, to_id, position, from_space, from_version, to_space, to_version, entity_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 ON CONFLICT (id) DO UPDATE SET
		   relation_type = EXCLUDED.relation_type,
		   from_id = EXCLUDED.from_id,
		   to_id = EXCLUDED.to_id,
		   position = EXCLUDED.position,
		   from_space = EXCLUDED.from_space,
		   from_version = EXCLUDED.from_version,
		   to_space = EXCLUDED.to_space,
		   to_version = EXCLUDED.to_version,
		   entity_id = EXCLUDED.entity_id,
		   status = 'alive',
		   updated_at = now()`,
		[
			id,
			idToHex(op.relationType),
			fromId,
			toId,
			op.position ?? null,
			op.fromSpace ? idToHex(op.fromSpace) : null,
			op.fromVersion ? idToHex(op.fromVersion) : null,
			op.toSpace ? idToHex(op.toSpace) : null,
			op.toVersion ? idToHex(op.toVersion) : null,
			entityId,
		],
	)
}
