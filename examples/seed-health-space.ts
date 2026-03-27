/**
 * Seed the Health space locally: create the Space type entity and the Health space entity.
 *
 * Usage: npx tsx examples/seed-health-space.ts
 */
import { SystemIds } from '@geoprotocol/geo-sdk'

const INGEST_URL = process.env.INGEST_URL ?? 'http://localhost:3001'
const SPACE_ID = '52c7ae149838b6d47ce0f3b2a5974546'

const res = await fetch(`${INGEST_URL}/edits/build`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-Space-Id': SPACE_ID,
	},
	body: JSON.stringify({
		name: 'Seed Health space',
		mutations: [
			{
				type: 'createEntity',
				params: {
					id: SystemIds.SPACE_TYPE,
					name: 'Space',
					types: [SystemIds.SCHEMA_TYPE],
				},
			},
			{
				type: 'createEntity',
				params: {
					id: SPACE_ID,
					name: 'Health',
					description:
						'Biological preparations that stimulate the immune system to recognize and protect against infectious diseases by inducing a targeted immune response.',
					types: [SystemIds.SPACE_TYPE],
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
console.log('Seeded:', JSON.stringify(result, null, 2))
