import { idToHex } from '@geo-runtime/shared'
import type { RestoreEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'

export async function restoreEntity(client: pg.PoolClient, op: RestoreEntity): Promise<void> {
	await client.query(`UPDATE entities SET status = 'alive', updated_at = now() WHERE id = $1`, [
		idToHex(op.id),
	])
}
