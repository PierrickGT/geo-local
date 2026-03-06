import type pg from 'pg'
import type { DeleteRelation } from '@geoprotocol/grc-20'
import { idToHex } from '@geo-runtime/shared'

export async function deleteRelation(client: pg.PoolClient, op: DeleteRelation): Promise<void> {
	await client.query(
		`UPDATE relations SET status = 'deleted', updated_at = now() WHERE id = $1`,
		[idToHex(op.id)],
	)
}
