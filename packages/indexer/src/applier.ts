import { idToHex, serializeValue } from '@geo-local/shared'
import type { Edit, Op, PropertyValue, UpdateEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { createEntity } from './ops/create-entity.js'
import { createRelation } from './ops/create-relation.js'
import { createValueRef } from './ops/create-value-ref.js'
import { deleteEntity } from './ops/delete-entity.js'
import { deleteRelation } from './ops/delete-relation.js'
import { updateEntity } from './ops/update-entity.js'
import { updateRelation } from './ops/update-relation.js'

export interface DecodedOp {
	kind: string
	entityId: string
	propertyId?: string
	before?: unknown
	after?: unknown
	relationType?: string
	fromId?: string
	toId?: string
}

/** Fetch the current triple value for a property on an entity, if it exists. */
async function getCurrentTripleValue(
	client: pg.PoolClient,
	entityId: string,
	propertyId: string,
): Promise<unknown> {
	const result = await client.query(
		'SELECT value FROM triples WHERE entity_id = $1 AND property_id = $2 LIMIT 1',
		[entityId, propertyId],
	)
	if (result.rows.length === 0) return null
	return result.rows[0].value
}

/** Serialize a PropertyValue for JSONB storage. */
function serializePropertyValue(pv: PropertyValue): unknown {
	return {
		propertyId: idToHex(pv.property),
		value: serializeValue(pv.value),
	}
}

/** Build decoded ops for an updateEntity op, fetching before values. */
async function decodeUpdateEntityOps(
	client: pg.PoolClient,
	op: UpdateEntity,
): Promise<DecodedOp[]> {
	const entityId = idToHex(op.id)
	const ops: DecodedOp[] = []

	// Unset operations: capture before value, after is null
	for (const u of op.unset) {
		const propertyId = idToHex(u.property)
		const before = await getCurrentTripleValue(client, entityId, propertyId)
		ops.push({
			kind: 'updateEntity',
			entityId,
			propertyId,
			before,
			after: null,
		})
	}

	// Set operations: capture before value, after is the new value
	for (const pv of op.set) {
		const propertyId = idToHex(pv.property)
		const before = await getCurrentTripleValue(client, entityId, propertyId)
		ops.push({
			kind: 'updateEntity',
			entityId,
			propertyId,
			before,
			after: serializePropertyValue(pv),
		})
	}

	return ops
}

/** Build a decoded op from a generic op (non-update types). */
function decodeOp(op: Op): DecodedOp {
	switch (op.type) {
		case 'createEntity':
			return {
				kind: 'createEntity',
				entityId: idToHex(op.id),
			}
		case 'deleteEntity':
			return {
				kind: 'deleteEntity',
				entityId: idToHex(op.id),
			}
		case 'createRelation':
			return {
				kind: 'createRelation',
				entityId: idToHex(op.id),
				relationType: idToHex(op.relationType),
				fromId: idToHex(op.from),
				toId: idToHex(op.to),
			}
		case 'deleteRelation':
			return {
				kind: 'deleteRelation',
				entityId: idToHex(op.id),
			}
		case 'updateRelation':
			return {
				kind: 'updateRelation',
				entityId: idToHex(op.id),
			}
		case 'createValueRef':
			return {
				kind: 'createValueRef',
				entityId: idToHex(op.id),
			}
		case 'restoreEntity':
			return {
				kind: 'restoreEntity',
				entityId: idToHex(op.id),
			}
		case 'restoreRelation':
			return {
				kind: 'restoreRelation',
				entityId: idToHex(op.id),
			}
	}
}

export async function applyEdit(
	client: pg.PoolClient,
	edit: Edit,
	spaceId: string,
): Promise<DecodedOp[]> {
	const decodedOps: DecodedOp[] = []

	for (const op of edit.ops) {
		switch (op.type) {
			case 'createEntity':
				await createEntity(client, op, spaceId)
				decodedOps.push(decodeOp(op))
				break
			case 'updateEntity': {
				const updateOps = await decodeUpdateEntityOps(client, op)
				await updateEntity(client, op, spaceId)
				decodedOps.push(...updateOps)
				break
			}
			case 'deleteEntity':
				await deleteEntity(client, op)
				decodedOps.push(decodeOp(op))
				break
			case 'createRelation':
				await createRelation(client, op)
				decodedOps.push(decodeOp(op))
				break
			case 'updateRelation':
				await updateRelation(client, op)
				decodedOps.push(decodeOp(op))
				break
			case 'deleteRelation':
				await deleteRelation(client, op)
				decodedOps.push(decodeOp(op))
				break
			case 'createValueRef':
				await createValueRef(client, op)
				decodedOps.push(decodeOp(op))
				break
			case 'restoreEntity':
			case 'restoreRelation':
				decodedOps.push(decodeOp(op))
				break
		}
	}

	return decodedOps
}
