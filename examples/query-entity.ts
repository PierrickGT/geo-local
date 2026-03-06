/**
 * Example: Query an entity from the API server.
 *
 * Usage: npx tsx examples/query-entity.ts <entity-id>
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3002'
const entityId = process.argv[2]

if (!entityId) {
	console.error('Usage: npx tsx examples/query-entity.ts <entity-id>')
	process.exit(1)
}

// Fetch entity details
const res = await fetch(`${API_URL}/api/entities/${entityId}`)

if (!res.ok) {
	console.error('Failed:', res.status, await res.text())
	process.exit(1)
}

const data = await res.json()
console.log(JSON.stringify(data, null, 2))
