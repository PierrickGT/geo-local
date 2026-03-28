/**
 * Tests for Search API Endpoints
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get } from './client'
import { searchEntities } from './search'

// Mock the client module
vi.mock('./client', () => ({
	get: vi.fn(),
	ApiError: vi.fn().mockImplementation((status: number, message: string, data: unknown) => {
		const error = new Error(message) as Error & { status: number; data: unknown }
		error.name = 'ApiError'
		error.status = status
		error.data = data
		return error
	}),
}))

const mockGet = vi.mocked(get)

describe('search API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('searchEntities', () => {
		it('searches with query only', async () => {
			const mockResponse = {
				results: [
					{
						entityId: 'entity-1',
						propertyId: 'prop-name',
						value: { value: 'John Doe' },
						language: null,
					},
				],
				entities: [],
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			const result = await searchEntities({ q: 'John' })

			expect(mockGet).toHaveBeenCalledWith('/search?q=John')
			expect(result).toEqual(mockResponse)
		})

		it('searches with limit', async () => {
			const mockResponse = {
				results: [],
				entities: [],
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			await searchEntities({ q: 'test', limit: 10 })

			expect(mockGet).toHaveBeenCalledWith('/search?q=test&limit=10')
		})

		it('URL encodes query string', async () => {
			const mockResponse = { results: [], entities: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await searchEntities({ q: 'hello world & more' })

			expect(mockGet).toHaveBeenCalledWith('/search?q=hello+world+%26+more')
		})

		it('throws ApiError on failure', async () => {
			mockGet.mockRejectedValueOnce(new ApiError(400, 'Bad request', { error: 'Query required' }))

			await expect(searchEntities({ q: '' })).rejects.toThrow(ApiError)
		})
	})
})
