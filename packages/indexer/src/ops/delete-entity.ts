import { idToHex } from '@geo-runtime/shared'
import type { DeleteEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'

export async function deleteEntity(client: pg.PoolClient, op: DeleteEntity): Promise<void> {
	await client.query('DELETE FROM entities WHERE id = $1', [idToHex(op.id)])
}
