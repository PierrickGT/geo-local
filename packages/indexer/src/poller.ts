import { createLogger } from '@geo-local/shared'
import { decodeEdit } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { applyEdit } from './applier.js'

const log = createLogger('indexer:poller')

interface PendingEdit {
	id: string
	spaceId: string
	blob: Buffer
}

export async function pollOnce(pool: pg.Pool, batchSize: number): Promise<number> {
	let processed = 0

	for (let i = 0; i < batchSize; i++) {
		const client = await pool.connect()
		let editId: string | undefined
		try {
			await client.query('BEGIN')

			const { rows } = await client.query<PendingEdit>(
				`SELECT id, space_id, blob FROM edits
				 WHERE status = 'pending'
				 ORDER BY created_at
				 FOR UPDATE SKIP LOCKED
				 LIMIT 1`,
			)

			if (rows.length === 0) {
				await client.query('ROLLBACK')
				break
			}

			const row = rows[0]
			editId = row.id

			await client.query(`UPDATE edits SET status = 'processing' WHERE id = $1`, [editId])

			const edit = decodeEdit(new Uint8Array(row.blob))
			const decodedOps = await applyEdit(client, edit, row.spaceId)

			await client.query(
				`UPDATE edits SET status = 'applied', applied_at = now(), decoded_ops = $2 WHERE id = $1`,
				[editId, JSON.stringify(decodedOps)],
			)

			await client.query('COMMIT')
			log.info({ editId }, 'Edit applied')
			processed++
		} catch (err) {
			await client.query('ROLLBACK').catch(() => {})

			const msg = err instanceof Error ? err.message : String(err)
			log.error({ editId, err: msg }, 'Edit failed')

			if (editId) {
				await pool
					.query(`UPDATE edits SET status = 'failed', error_msg = $2 WHERE id = $1`, [editId, msg])
					.catch(() => {})
			}
		} finally {
			client.release()
		}
	}

	return processed
}
