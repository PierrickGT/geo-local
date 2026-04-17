import { idToHex } from '@geo-local/shared'
import type { UpdateRelation } from '@geoprotocol/grc-20'
import type pg from 'pg'

const FIELD_MAP: Record<string, string> = {
	fromSpace: 'from_space',
	fromVersion: 'from_version',
	toSpace: 'to_space',
	toVersion: 'to_version',
	position: 'position',
}

export async function updateRelation(client: pg.PoolClient, op: UpdateRelation): Promise<void> {
	const id = idToHex(op.id)
	const sets: string[] = []
	const values: unknown[] = [id] // $1 = id for WHERE clause
	let idx = 2

	// 1. NULL out unset fields
	for (const field of op.unset) {
		const col = FIELD_MAP[field]
		if (col) {
			sets.push(`${col} = NULL`)
		}
	}

	// 2. Set provided fields
	if (op.fromSpace) {
		sets.push(`from_space = $${idx}`)
		values.push(idToHex(op.fromSpace))
		idx++
	}
	if (op.fromVersion) {
		sets.push(`from_version = $${idx}`)
		values.push(idToHex(op.fromVersion))
		idx++
	}
	if (op.toSpace) {
		sets.push(`to_space = $${idx}`)
		values.push(idToHex(op.toSpace))
		idx++
	}
	if (op.toVersion) {
		sets.push(`to_version = $${idx}`)
		values.push(idToHex(op.toVersion))
		idx++
	}
	if (op.position !== undefined) {
		sets.push(`position = $${idx}`)
		values.push(op.position)
		idx++
	}

	sets.push('updated_at = now()')

	await client.query(`UPDATE relations SET ${sets.join(', ')} WHERE id = $1`, values)
}
