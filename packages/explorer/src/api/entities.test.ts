import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEntities } from './entities'

vi.mock('./client', () => ({
	get: vi.fn(),
}))

import { get } from './client'
const mockGet = vi.mocked(get)

afterEach(() => {
	mockGet.mockReset()
})

describe('getEntities', () => {
	it('sends sort and order query params', async () => {
		mockGet.mockResolvedValueOnce({ entities: [], total: 0 })

		await getEntities({ sort: 'created_at', order: 'asc' })

		expect(mockGet).toHaveBeenCalledWith('/entities?sort=created_at&order=asc')
	})

	it('sends all params together', async () => {
		mockGet.mockResolvedValueOnce({ entities: [], total: 0 })

		await getEntities({
			type: 'abc',
			limit: 10,
			offset: 20,
			sort: 'properties_text',
			order: 'desc',
		})

		const call = mockGet.mock.calls[0][0] as string
		expect(call).toContain('type=abc')
		expect(call).toContain('limit=10')
		expect(call).toContain('offset=20')
		expect(call).toContain('sort=properties_text')
		expect(call).toContain('order=desc')
	})

	it('omits sort and order when not provided', async () => {
		mockGet.mockResolvedValueOnce({ entities: [], total: 0 })

		await getEntities({ limit: 5 })

		const call = mockGet.mock.calls[0][0] as string
		expect(call).not.toContain('sort=')
		expect(call).not.toContain('order=')
	})
})
