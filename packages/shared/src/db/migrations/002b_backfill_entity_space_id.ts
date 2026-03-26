/**
 * Backfill entity space_id by decoding edit blobs and extracting entity IDs.
 * Runs as a TypeScript migration — exports a run() function.
 */
import { decodeEdit } from '@geoprotocol/grc-20'
import { createLogger, getPool, idToHex } from '../..'

const log = createLogger('migrate:002b')

interface EditRow {
	id: string
	spaceId: string
	blob: Buffer
}

/** Extract entity IDs referenced by an op. */
function extractEntityIds(op: Record<string, unknown>): Uint8Array[] {
	const ids: Uint8Array[] = []

	switch (op.type) {
		case 'createEntity':
		case 'updateEntity':
		case 'deleteEntity':
		case 'restoreEntity':
			if (op.id) ids.push(op.id as Uint8Array)
			break
		case 'createRelation':
			if (op.from) ids.push(op.from as Uint8Array)
			if (op.to) ids.push(op.to as Uint8Array)
			if (op.entity) ids.push(op.entity as Uint8Array)
			break
		case 'deleteRelation':
		case 'restoreRelation':
			break
		case 'createValueRef':
			if (op.entity) ids.push(op.entity as Uint8Array)
			break
		case 'updateRelation':
			break
	}

	return ids
}

export async function run(): Promise<void> {
	const pool = getPool()

	const { rows: edits } = await pool.query<EditRow>(
		`SELECT id, space_id, blob FROM edits
		 WHERE space_id IS NOT NULL AND space_id != '' AND space_id != '00000000000000000000000000000000' AND blob IS NOT NULL`,
	)

	log.info({ total: edits.length }, 'Processing edits with space_id')

	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		let updated = 0
		for (const row of edits) {
			const edit = decodeEdit(new Uint8Array(row.blob))
			for (const op of edit.ops) {
				for (const rawId of extractEntityIds(op as Record<string, unknown>)) {
					const hexId = idToHex(rawId)
					const result = await client.query(
						`UPDATE entities SET space_id = $2 WHERE id = $1 AND (space_id IS NULL OR space_id = '') RETURNING id`,
						[hexId, row.spaceId],
					)
					if (result.rows.length > 0) updated++
				}
			}
		}
		await client.query('COMMIT')
		log.info({ updated, editsProcessed: edits.length }, 'Entity space_id backfill complete')
	} catch (err) {
		await client.query('ROLLBACK')
		throw err
	} finally {
		client.release()
	}
}
