import type pg from 'pg'
import type { RestoreRelation } from '@geoprotocol/grc-20'
import { idToHex } from '@geo-runtime/shared'

export async function restoreRelation(client: pg.PoolClient, op: RestoreRelation): Promise<void> {
	await client.query(
		`UPDATE relations SET status = 'alive', updated_at = now() WHERE id = $1`,
		[idToHex(op.id)],
	)
}
