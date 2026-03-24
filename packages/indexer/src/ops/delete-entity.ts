import { idToHex } from '@geo-runtime/shared'
import type { DeleteEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'

export async function deleteEntity(client: pg.PoolClient, op: DeleteEntity): Promise<void> {
	await client.query(`UPDATE entities SET status = 'deleted', updated_at = now() WHERE id = $1`, [
		idToHex(op.id),
	])
}
