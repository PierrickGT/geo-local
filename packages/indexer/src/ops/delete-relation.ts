import { idToHex } from '@geo-local/shared'
import type { DeleteRelation } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { deleteEntityIfOrphan } from './shared.js'

export async function deleteRelation(client: pg.PoolClient, op: DeleteRelation): Promise<void> {
	const id = idToHex(op.id)

	// Get from_id and to_id before deleting
	const result = await client.query('SELECT from_id, to_id FROM relations WHERE id = $1', [id])

	await client.query('DELETE FROM relations WHERE id = $1', [id])

	// Clean up orphaned entities (no triples, no other relations)
	if (result.rows.length > 0) {
		const { from_id, to_id } = result.rows[0]
		await deleteEntityIfOrphan(client, from_id)
		await deleteEntityIfOrphan(client, to_id)
	}
}
