import { afterEach, describe, expect, it, vi } from 'vitest'

let mockQuery: ReturnType<typeof vi.fn>

vi.mock('@geo-local/shared', () => ({
	config: {},
	createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
	getPool: () => ({ query: mockQuery }),
}))

async function createApp() {
	const express = await import('express')
	const { createRouter } = await import('./routes.js')
	const app = express.default()
	app.use(express.default.json())
	app.use('/api', createRouter())
	return app
}

describe('GET /api/entities', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns paginated entity list', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({ rows: [{ total: 1 }] })
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'abc123',
						created_at: new Date('2025-01-01'),
						updated_at: new Date('2025-01-02'),
						properties_text: 'Test Entity',
					},
				],
			})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities')

		expect(res.status).toBe(200)
		expect(res.body.total).toBe(1)
		expect(res.body.entities).toHaveLength(1)
		expect(res.body.entities[0].id).toBe('abc123')
	})

	it('filters by type when provided', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({ rows: [{ total: 0 }] })
			.mockResolvedValueOnce({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities?type=sometype')

		expect(res.status).toBe(200)
		expect(res.body.total).toBe(0)
	})

	it('respects limit and offset params', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({ rows: [{ total: 100 }] })
			.mockResolvedValueOnce({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.get('/api/entities?limit=5&offset=10')

		expect(res.status).toBe(200)
	})

	it('returns 500 on database error', async () => {
		mockQuery = vi.fn().mockRejectedValue(new Error('DB down'))

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities')

		expect(res.status).toBe(500)
	})
})

describe('GET /api/entities/:id', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns entity with triples and relations', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({
				rows: [{ id: 'abc123 ', created_at: new Date(), updated_at: new Date() }],
			})
			.mockResolvedValueOnce({
				rows: [
					{ property_id: 'prop1 ', value_type: 'text', value: { value: 'Hello' }, language: '' },
				],
			})
			.mockResolvedValueOnce({
				rows: [{ id: 'rel1 ', relation_type: 'type ', to_id: 'to1 ', position: null }],
			})
			.mockResolvedValueOnce({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities/abc123')

		expect(res.status).toBe(200)
		expect(res.body.entity.id).toBe('abc123')
		expect(res.body.entity.triples).toHaveLength(1)
		expect(res.body.entity.outgoing).toHaveLength(1)
	})

	it('returns 404 for non-existent entity', async () => {
		mockQuery = vi.fn().mockResolvedValue({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities/nonexistent')

		expect(res.status).toBe(404)
		expect(res.body.error).toContain('not found')
	})
})

describe('GET /api/entities/:id/relations', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns outgoing relations by default', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{ id: 'rel1 ', relation_type: 'type ', from_id: 'abc ', to_id: 'def ', position: null },
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities/abc/relations')

		expect(res.status).toBe(200)
		expect(res.body.relations).toHaveLength(1)
	})

	it('returns incoming relations when dir=incoming', async () => {
		mockQuery = vi.fn().mockResolvedValue({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.get('/api/entities/abc/relations?dir=incoming')

		expect(res.status).toBe(200)
	})
})

describe('GET /api/search', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns 400 when q is missing', async () => {
		mockQuery = vi.fn()
		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/search')

		expect(res.status).toBe(400)
	})

	it('returns 400 when q is empty', async () => {
		mockQuery = vi.fn()
		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/search?q=')

		expect(res.status).toBe(400)
	})

	it('returns search results', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({
				rows: [{ entity_id: 'abc ', property_id: 'name ', value: { value: 'Test' }, language: '' }],
			})
			.mockResolvedValueOnce({
				rows: [
					{ id: 'abc ', created_at: new Date(), updated_at: new Date(), properties_text: 'Test' },
				],
			})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/search?q=test')

		expect(res.status).toBe(200)
		expect(res.body.results).toHaveLength(1)
		expect(res.body.entities).toHaveLength(1)
	})

	it('skips entity search when query is shorter than 4 chars', async () => {
		mockQuery = vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })

		const app = await createApp()
		await (await import('supertest')).default(app).get('/api/search?q=ab')

		// Only one query call (triples), entity search skipped for short queries
		expect(mockQuery).toHaveBeenCalledTimes(1)
	})
})

describe('GET /api/edits', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns edits list', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [{ id: 'edit1 ', status: 'applied ', created_at: new Date(), decoded_ops: null }],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits')

		expect(res.status).toBe(200)
		expect(res.body.edits).toHaveLength(1)
	})

	it('filters by status', async () => {
		mockQuery = vi.fn().mockResolvedValue({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits?status=pending')

		expect(res.status).toBe(200)
		expect(mockQuery).toHaveBeenCalledTimes(1)
		const query = mockQuery.mock.calls[0][0] as string
		expect(query).toContain('WHERE status =')
	})

	it('includes decodedOps field (null for pending edits)', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit1 ',
					status: 'pending ',
					created_at: new Date(),
					decoded_ops: null,
				},
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits')

		expect(res.status).toBe(200)
		expect(res.body.edits[0].decodedOps).toBeNull()
	})

	it('includes decodedOps field (array for applied edits)', async () => {
		const decodedOps = [
			{
				kind: 'createEntity',
				entityId: 'abc123',
			},
		]
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit2 ',
					status: 'applied ',
					created_at: new Date(),
					decoded_ops: decodedOps,
				},
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits?status=applied')

		expect(res.status).toBe(200)
		expect(res.body.edits[0].decodedOps).toEqual(decodedOps)
	})

	it('selects decoded_ops column', async () => {
		mockQuery = vi.fn().mockResolvedValue({ rows: [] })

		const app = await createApp()
		await (await import('supertest')).default(app).get('/api/edits')

		const query = mockQuery.mock.calls[0][0] as string
		expect(query).toContain('decoded_ops')
	})
})

describe('GET /api/edits/:id', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns single edit', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit1 ',
					status: 'applied ',
					op_count: 3,
					created_at: new Date(),
					decoded_ops: null,
				},
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits/edit1')

		expect(res.status).toBe(200)
		expect(res.body.id).toBe('edit1')
	})

	it('returns 404 for non-existent edit', async () => {
		mockQuery = vi.fn().mockResolvedValue({ rows: [] })

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits/nonexistent')

		expect(res.status).toBe(404)
	})

	it('includes decodedOps (null for pending edit)', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit1 ',
					status: 'pending ',
					op_count: 1,
					created_at: new Date(),
					decoded_ops: null,
				},
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits/edit1')

		expect(res.status).toBe(200)
		expect(res.body.decodedOps).toBeNull()
	})

	it('includes decodedOps (array for applied edit)', async () => {
		const decodedOps = [
			{
				kind: 'updateEntity',
				entityId: 'abc123',
				propertyId: 'prop1',
				before: null,
				after: { propertyId: 'prop1', value: { type: 'text', payload: 'Hello' } },
			},
		]
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit2 ',
					status: 'applied ',
					op_count: 2,
					created_at: new Date(),
					decoded_ops: decodedOps,
				},
			],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/edits/edit2')

		expect(res.status).toBe(200)
		expect(res.body.decodedOps).toEqual(decodedOps)
	})

	it('selects decoded_ops column', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [
				{
					id: 'edit1 ',
					status: 'applied ',
					op_count: 3,
					created_at: new Date(),
					decoded_ops: null,
				},
			],
		})

		const app = await createApp()
		await (await import('supertest')).default(app).get('/api/edits/edit1')

		const query = mockQuery.mock.calls[0][0] as string
		expect(query).toContain('decoded_ops')
	})
})

describe('GET /api/types', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns distinct type entities', async () => {
		mockQuery = vi.fn().mockResolvedValue({
			rows: [{ id: 'type1 ', name: 'Person' }],
		})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/types')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(1)
	})
})

describe('response formatting', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('converts snake_case keys to camelCase', async () => {
		mockQuery = vi
			.fn()
			.mockResolvedValueOnce({ rows: [{ total: 1 }] })
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'abc',
						created_at: new Date('2025-01-01'),
						updated_at: new Date('2025-01-02'),
						properties_text: 'Test',
					},
				],
			})

		const app = await createApp()
		const res = await (await import('supertest')).default(app).get('/api/entities')

		const entity = res.body.entities[0]
		expect(entity.createdAt).toBeDefined()
		expect(entity.updatedAt).toBeDefined()
		expect(entity.propertiesText).toBeDefined()
		expect(entity.created_at).toBeUndefined()
	})
})
