import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@geo-local/shared', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@geo-local/shared')>()
	return {
		...actual,
		createLogger: () => ({ info: vi.fn(), error: vi.fn(), debug: vi.fn() }),
	}
})

vi.mock('@geoprotocol/grc-20', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@geoprotocol/grc-20')>()
	return {
		...actual,
		decodeEdit: vi.fn(),
	}
})

function createMockClient() {
	const query = vi.fn()
	return {
		query,
		release: vi.fn(),
	}
}

function createMockPool(client: ReturnType<typeof createMockClient>) {
	return {
		connect: vi.fn().mockResolvedValue(client),
		query: vi.fn(),
	}
}

describe('pollOnce', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns 0 when no pending edits', async () => {
		const client = createMockClient()
		client.query
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({ rows: [] }) // SELECT
			.mockResolvedValueOnce({}) // ROLLBACK
		const pool = createMockPool(client)

		const { pollOnce } = await import('./poller.js')
		const count = await pollOnce(pool as never, 10)

		expect(count).toBe(0)
	})

	it('processes a single pending edit successfully', async () => {
		const { decodeEdit } = await import('@geoprotocol/grc-20')
		const { idToHex } = await import('@geo-local/shared')

		const { randomId } = await import('@geoprotocol/grc-20')
		const editId = randomId()
		const hexId = idToHex(editId)
		const mockEdit = { id: editId, ops: [] }
		vi.mocked(decodeEdit).mockReturnValue(mockEdit as never)

		const client = createMockClient()
		client.query
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({
				rows: [{ id: hexId, space_id: 'space1', blob: Buffer.from('fake') }],
			})
			.mockResolvedValueOnce({}) // UPDATE processing
			.mockResolvedValueOnce({}) // UPDATE applied
			.mockResolvedValueOnce({}) // COMMIT

		const pool = createMockPool(client)
		const { pollOnce } = await import('./poller.js')
		const count = await pollOnce(pool as never, 1)

		expect(count).toBe(1)
		expect(pool.connect).toHaveBeenCalledTimes(1)
		expect(client.release).toHaveBeenCalled()
	})

	it('handles edit processing failure gracefully', async () => {
		const { decodeEdit } = await import('@geoprotocol/grc-20')
		const { idToHex } = await import('@geo-local/shared')
		const { randomId } = await import('@geoprotocol/grc-20')

		const editId = randomId()
		const hexId = idToHex(editId)
		vi.mocked(decodeEdit).mockImplementation(() => {
			throw new Error('Decode failed')
		})

		const client = createMockClient()
		client.query
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({
				rows: [{ id: hexId, space_id: 'space1', blob: Buffer.from('bad') }],
			})
			.mockResolvedValueOnce({}) // UPDATE processing
			.mockResolvedValueOnce({}) // ROLLBACK

		const poolQuery = vi.fn().mockResolvedValue({})
		const pool = {
			connect: vi.fn().mockResolvedValue(client),
			query: poolQuery,
		}

		const { pollOnce } = await import('./poller.js')
		const count = await pollOnce(pool as never, 1)

		expect(count).toBe(0)
		expect(poolQuery).toHaveBeenCalledWith(
			expect.stringContaining("status = 'failed'"),
			expect.arrayContaining([hexId]),
		)
	})

	it('stops polling when no more pending edits', async () => {
		const client = createMockClient()
		client.query
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({ rows: [] }) // SELECT - no results
			.mockResolvedValueOnce({}) // ROLLBACK
		const pool = createMockPool(client)

		const { pollOnce } = await import('./poller.js')
		const count = await pollOnce(pool as never, 5)

		expect(count).toBe(0)
		// Connects once, finds no edits, breaks
		expect(pool.connect).toHaveBeenCalledTimes(1)
	})
})

describe('applyEdit', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('delegates to correct op handler based on type', async () => {
		const mockClient = createMockClient()

		const createEntityModule = await import('./ops/create-entity.js')
		const createRelationModule = await import('./ops/create-relation.js')
		const deleteEntityModule = await import('./ops/delete-entity.js')
		const deleteRelationModule = await import('./ops/delete-relation.js')
		const updateEntityModule = await import('./ops/update-entity.js')
		const updateRelationModule = await import('./ops/update-relation.js')
		const createValueRefModule = await import('./ops/create-value-ref.js')

		const createEntitySpy = vi.spyOn(createEntityModule, 'createEntity').mockResolvedValue()
		const createRelationSpy = vi.spyOn(createRelationModule, 'createRelation').mockResolvedValue()
		const deleteEntitySpy = vi.spyOn(deleteEntityModule, 'deleteEntity').mockResolvedValue()
		const deleteRelationSpy = vi.spyOn(deleteRelationModule, 'deleteRelation').mockResolvedValue()
		const updateEntitySpy = vi.spyOn(updateEntityModule, 'updateEntity').mockResolvedValue()
		const updateRelationSpy = vi.spyOn(updateRelationModule, 'updateRelation').mockResolvedValue()
		const createValueRefSpy = vi.spyOn(createValueRefModule, 'createValueRef').mockResolvedValue()

		const { applyEdit } = await import('./applier.js')
		const mockEdit = {
			id: {} as never,
			name: 'test',
			authors: [],
			ops: [
				{ type: 'createEntity', id: {} as never, values: [] },
				{
					type: 'createRelation',
					id: {} as never,
					from: {} as never,
					to: {} as never,
					relationType: {} as never,
				},
				{ type: 'updateEntity', id: {} as never, set: [], unset: [] },
				{ type: 'deleteEntity', id: {} as never },
				{ type: 'deleteRelation', id: {} as never },
				{ type: 'updateRelation', id: {} as never, unset: [] },
				{ type: 'createValueRef', id: {} as never, entity: {} as never, property: {} as never },
				{ type: 'restoreEntity', id: {} as never },
				{ type: 'restoreRelation', id: {} as never },
			],
		}

		await applyEdit(mockClient as never, mockEdit as never, 'space1')

		expect(createEntitySpy).toHaveBeenCalledTimes(1)
		expect(createRelationSpy).toHaveBeenCalledTimes(1)
		expect(updateEntitySpy).toHaveBeenCalledTimes(1)
		expect(deleteEntitySpy).toHaveBeenCalledTimes(1)
		expect(deleteRelationSpy).toHaveBeenCalledTimes(1)
		expect(updateRelationSpy).toHaveBeenCalledTimes(1)
		expect(createValueRefSpy).toHaveBeenCalledTimes(1)
	})
})
