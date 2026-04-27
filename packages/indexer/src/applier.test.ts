import type { Edit } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { applyEdit } from './applier.js'

function createMockClient(queryResults: unknown[] = []): pg.PoolClient {
	let callIdx = 0
	return {
		query: vi.fn(async () => {
			const result = queryResults[callIdx]
			callIdx++
			return result ?? { rows: [] }
		}),
		release: vi.fn(),
	} as unknown as pg.PoolClient
}

function hexToFakeId(hex: string): Uint8Array {
	const bytes = new Uint8Array(16)
	for (let i = 0; i < 16; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0
	}
	return bytes
}

describe('applyEdit', () => {
	it('returns decoded ops for createEntity', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'createEntity',
					id: entityId,
					values: [],
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('createEntity')
		expect(typeof result[0].entityId).toBe('string')
	})

	it('returns decoded ops with before/after for updateEntity set', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const propertyId = hexToFakeId('11223344'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'updateEntity',
					id: entityId,
					set: [
						{
							property: propertyId,
							value: { type: 'text', value: 'Hello World' },
						},
					],
					unset: [],
				},
			],
		}

		const client = createMockClient([
			// getCurrentTripleValue (before)
			{ rows: [{ value: { type: 'text', payload: 'Old Value' } }] },
			// updateEntity queries
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
		])

		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('updateEntity')
		expect(result[0].before).toEqual({ type: 'text', payload: 'Old Value' })
		expect(result[0].after).toBeDefined()
		expect((result[0].after as Record<string, unknown>).propertyId).toBeDefined()
	})

	it('returns decoded ops with before=null for updateEntity set on new property', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const propertyId = hexToFakeId('11223344'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'updateEntity',
					id: entityId,
					set: [
						{
							property: propertyId,
							value: { type: 'text', value: 'New Value' },
						},
					],
					unset: [],
				},
			],
		}

		const client = createMockClient([
			// getCurrentTripleValue (no existing triple)
			{ rows: [] },
			// updateEntity queries
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
			{ rows: [] },
		])

		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].before).toBeNull()
		expect(result[0].after).toBeDefined()
	})

	it('returns decoded ops with before for updateEntity unset', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const propertyId = hexToFakeId('11223344'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'updateEntity',
					id: entityId,
					set: [],
					unset: [
						{
							property: propertyId,
							language: { type: 'all' },
						},
					],
				},
			],
		}

		const client = createMockClient([
			// getCurrentTripleValue (before)
			{ rows: [{ value: { type: 'text', payload: 'Being Removed' } }] },
			// updateEntity queries
			{ rows: [] },
			{ rows: [] },
		])

		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('updateEntity')
		expect(result[0].before).toEqual({ type: 'text', payload: 'Being Removed' })
		expect(result[0].after).toBeNull()
	})

	it('returns decoded ops for deleteEntity', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'deleteEntity',
					id: entityId,
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('deleteEntity')
		expect(typeof result[0].entityId).toBe('string')
	})

	it('returns decoded ops for createRelation with relation metadata', async () => {
		const relationId = hexToFakeId('aabbccdd'.repeat(4))
		const fromId = hexToFakeId('11111111'.repeat(4))
		const toId = hexToFakeId('22222222'.repeat(4))
		const relationType = hexToFakeId('33333333'.repeat(4))

		const edit: Edit = {
			id: hexToFakeId('44444444'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'createRelation',
					id: relationId,
					relationType,
					from: fromId,
					to: toId,
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('createRelation')
		expect(result[0].relationType).toBeDefined()
		expect(result[0].fromId).toBeDefined()
		expect(result[0].toId).toBeDefined()
	})

	it('returns decoded ops for deleteRelation', async () => {
		const relationId = hexToFakeId('aabbccdd'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'deleteRelation',
					id: relationId,
				},
			],
		}

		const client = createMockClient([{ rows: [{ from_id: 'a', to_id: 'b' }] }])
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('deleteRelation')
	})

	it('returns decoded ops for multiple ops', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const propertyId = hexToFakeId('11223344'.repeat(4))
		const relationId = hexToFakeId('55555555'.repeat(4))
		const fromId = hexToFakeId('11111111'.repeat(4))
		const toId = hexToFakeId('22222222'.repeat(4))

		const edit: Edit = {
			id: hexToFakeId('44444444'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'createEntity',
					id: entityId,
					values: [
						{
							property: propertyId,
							value: { type: 'text', value: 'Test' },
						},
					],
				},
				{
					type: 'createRelation',
					id: relationId,
					relationType: hexToFakeId('33333333'.repeat(4)),
					from: fromId,
					to: toId,
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(2)
		expect(result[0].kind).toBe('createEntity')
		expect(result[1].kind).toBe('createRelation')
	})

	it('returns empty array for edit with no ops', async () => {
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toEqual([])
	})

	it('returns decoded ops for restoreEntity (no-op)', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'restoreEntity',
					id: entityId,
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('restoreEntity')
	})

	it('returns decoded ops for restoreRelation (no-op)', async () => {
		const entityId = hexToFakeId('aabbccdd'.repeat(4))
		const edit: Edit = {
			id: hexToFakeId('11111111'.repeat(4)),
			name: 'test',
			authors: [],
			createdAt: BigInt(0),
			ops: [
				{
					type: 'restoreRelation',
					id: entityId,
				},
			],
		}

		const client = createMockClient()
		const result = await applyEdit(client, edit, 'test-space')

		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe('restoreRelation')
	})
})
