import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRouter } from './routes.js'

vi.mock('@geo-local/shared', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@geo-local/shared')>()
	return {
		...actual,
		config: { spaceId: 'aabb0000000000000000000000000000' },
		createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
		getPool: () => mockPool,
	}
})

let mockPool: { query: ReturnType<typeof vi.fn> }

function setupMockPool(queryMock?: ReturnType<typeof vi.fn>) {
	mockPool = { query: queryMock ?? vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) }
	return mockPool
}

async function createApp() {
	const express = await import('express')
	const app = express.default()
	app.use('/edits', createRouter())
	return app
}

describe('POST /edits (binary)', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('rejects empty body with 400', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits')
			.set('Content-Type', 'application/octet-stream')
			.send(Buffer.alloc(0))

		expect(res.status).toBe(400)
		expect(res.body.error).toBeDefined()
	})

	it('rejects invalid binary with 400', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits')
			.set('Content-Type', 'application/octet-stream')
			.send(Buffer.from('not-a-valid-edit'))

		expect(res.status).toBe(400)
		expect(res.body.error).toBeDefined()
	})
})

describe('POST /edits/build (JSON mutations)', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('rejects missing mutations array with 400', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({})

		expect(res.status).toBe(400)
		expect(res.body.error).toContain('mutations')
	})

	it('rejects empty mutations array with 400', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({ mutations: [] })

		expect(res.status).toBe(400)
		expect(res.body.error).toContain('mutations')
	})

	it('rejects non-array mutations with 400', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({ mutations: 'not-an-array' })

		expect(res.status).toBe(400)
	})

	it('successfully processes createEntity mutation', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({
				name: 'Test edit',
				mutations: [
					{
						type: 'createEntity',
						params: { name: 'Test Entity' },
					},
				],
			})

		expect(res.status).toBe(201)
		expect(res.body.id).toBeDefined()
		expect(res.body.opCount).toBeGreaterThan(0)
	})

	it('uses X-Space-ID header when provided', async () => {
		const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })
		setupMockPool(queryMock)
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.set('X-Space-ID', 'customspace000000000000000000000')
			.send({
				name: 'Test edit',
				mutations: [
					{
						type: 'createEntity',
						params: { name: 'Test' },
					},
				],
			})

		expect(res.status).toBe(201)
		const insertCall = queryMock.mock.calls.find(
			(call: unknown[]) =>
				typeof call[0] === 'string' && (call[0] as string).includes('INSERT INTO edits'),
		)
		expect(insertCall).toBeDefined()
		const params = (insertCall as unknown[])[1] as unknown[]
		expect(params[1]).toBe('customspace000000000000000000000')
	})

	it('processes deleteEntity mutation for non-existent entity', async () => {
		const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })
		setupMockPool(queryMock)
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({
				mutations: [
					{
						type: 'deleteEntity',
						params: { id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
					},
				],
			})

		expect(res.status).toBe(201)
		expect(res.body.id).toBeDefined()
	})

	it('returns entityIds in response', async () => {
		setupMockPool()
		const app = await createApp()
		const res = await (await import('supertest'))
			.default(app)
			.post('/edits/build')
			.set('Content-Type', 'application/json')
			.send({
				name: 'Multi entity',
				mutations: [
					{
						type: 'createEntity',
						params: { name: 'Entity 1' },
					},
					{
						type: 'createEntity',
						params: { name: 'Entity 2' },
					},
				],
			})

		expect(res.status).toBe(201)
		expect(res.body.entityIds).toHaveLength(2)
	})
})
