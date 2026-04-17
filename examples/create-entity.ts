/**
 * Example: Create an entity using geo-sdk and submit it to the ingest server.
 *
 * Usage: npx tsx examples/create-entity.ts
 */
import { Graph, IdUtils, SystemIds } from '@geoprotocol/geo-sdk'
import { createEdit, encodeEdit, formatId } from '@geoprotocol/grc-20'

const INGEST_URL = process.env.INGEST_URL ?? 'http://localhost:3001'
const SPACE_ID = process.env.SPACE_ID ?? '00000000000000000000000000000000'

// 1. Create an entity with name, description, and a type
const { id: entityId, ops: entityOps } = Graph.createEntity({
	name: 'San Francisco',
	description: 'A city in California',
	types: [SystemIds.SCHEMA_TYPE],
	values: [
		{
			property: SystemIds.NAME_PROPERTY,
			type: 'text',
			value: 'San Francisco',
		},
	],
})

console.log('Entity ID:', entityId)

// 2. Create a relation
const { id: relationId, ops: relationOps } = Graph.createRelation({
	fromEntity: entityId,
	toEntity: entityId, // self-referential for demo
	type: SystemIds.TYPES_PROPERTY,
})

console.log('Relation ID:', relationId)

// 3. Build an edit containing all ops
const authorId = IdUtils.toGrcId(IdUtils.generate())
const allOps = [...entityOps, ...relationOps]
const edit = createEdit({
	name: 'Create San Francisco entity',
	authors: [authorId],
	ops: allOps,
})

console.log('Edit ID:', formatId(edit.id))
console.log('Op count:', edit.ops.length)

// 4. Encode and submit to ingest
const blob = encodeEdit(edit)

const res = await fetch(`${INGEST_URL}/edits`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/octet-stream',
		'X-Space-Id': SPACE_ID,
	},
	body: blob,
})

if (!res.ok) {
	console.error('Failed:', res.status, await res.text())
	process.exit(1)
}

const result = await res.json()
console.log('Submitted:', result)
