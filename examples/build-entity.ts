/**
 * Example: Use the /edits/build endpoint to create an entity via JSON mutations.
 *
 * Usage: npx tsx examples/build-entity.ts
 */
import { SystemIds } from '@geoprotocol/geo-sdk'

const INGEST_URL = process.env.INGEST_URL ?? 'http://localhost:3001'
const SPACE_ID = process.env.SPACE_ID ?? '00000000000000000000000000000000'

const res = await fetch(`${INGEST_URL}/edits/build`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-Space-Id': SPACE_ID,
	},
	body: JSON.stringify({
		name: 'Create a new topic',
		mutations: [
			{
				type: 'createEntity',
				params: {
					name: 'Artificial Intelligence',
					description: 'The simulation of human intelligence by machines',
					types: [SystemIds.SCHEMA_TYPE],
				},
			},
		],
	}),
})

if (!res.ok) {
	console.error('Failed:', res.status, await res.text())
	process.exit(1)
}

const result = await res.json()
console.log('Created:', JSON.stringify(result, null, 2))
