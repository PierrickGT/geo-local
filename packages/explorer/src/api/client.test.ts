import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get, post, request } from './client'
import type { EntitiesResponse, SearchResponse } from './types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('client', () => {
	beforeEach(() => {
		mockFetch.mockReset()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('ApiError', () => {
		it('creates error with status, message, and data', () => {
			const data = { error: 'Not found' }
			const error = new ApiError(404, 'API Error: 404 Not Found', data)

			expect(error.status).toBe(404)
			expect(error.message).toBe('API Error: 404 Not Found')
			expect(error.data).toEqual(data)
			expect(error.name).toBe('ApiError')
		})

		it('extracts API message from error data', () => {
			const error = new ApiError(404, 'Error', { error: 'Entity not found' })
			expect(error.getApiMessage()).toBe('Entity not found')
		})

		it('returns undefined when no API message in data', () => {
			const error = new ApiError(500, 'Error', {})
			expect(error.getApiMessage()).toBeUndefined()
		})

		it('returns undefined when data is not an object', () => {
			const error = new ApiError(500, 'Error', 'string data')
			expect(error.getApiMessage()).toBeUndefined()
		})
	})

	describe('request', () => {
		it('makes GET request and returns parsed JSON', async () => {
			const mockResponse: EntitiesResponse = {
				entities: [],
				total: 0,
				limit: 20,
				offset: 0,
			}
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const result = await request<EntitiesResponse>('/entities')

			expect(mockFetch).toHaveBeenCalledWith(
				'/api/entities',
				expect.objectContaining({
					headers: { 'Content-Type': 'application/json' },
				}),
			)
			expect(result).toEqual(mockResponse)
		})

		it('includes query parameters in URL', async () => {
			const mockResponse: EntitiesResponse = {
				entities: [],
				total: 0,
				limit: 20,
				offset: 0,
			}
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			await request<EntitiesResponse>('/entities?type=foo&limit=10')

			expect(mockFetch).toHaveBeenCalledWith('/api/entities?type=foo&limit=10', expect.any(Object))
		})

		it('throws ApiError on non-2xx response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: () => Promise.resolve({ error: 'Entity not found' }),
			})

			try {
				await request('/entities/missing')
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError)
				expect((error as ApiError).status).toBe(404)
				expect((error as ApiError).getApiMessage()).toBe('Entity not found')
			}
		})

		it('throws ApiError with empty data when response body is invalid JSON', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: () => Promise.reject(new Error('Invalid JSON')),
			})

			try {
				await request('/entities')
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError)
				expect((error as ApiError).status).toBe(500)
				expect((error as ApiError).data).toEqual({})
			}
		})

		it('merges custom headers', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({}),
			})

			await request('/entities', {
				headers: { 'X-Custom': 'value' },
			})

			expect(mockFetch).toHaveBeenCalledWith(
				'/api/entities',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'X-Custom': 'value',
					}),
				}),
			)
		})
	})

	describe('get', () => {
		it('makes GET request', async () => {
			const mockResponse: SearchResponse = { results: [] }
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const result = await get<SearchResponse>('/search?q=test')

			expect(mockFetch).toHaveBeenCalledWith(
				'/api/search?q=test',
				expect.objectContaining({
					method: 'GET',
				}),
			)
			expect(result).toEqual(mockResponse)
		})
	})

	describe('post', () => {
		it('makes POST request with JSON body', async () => {
			const body = { name: 'test' }
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			})

			const result = await post<{ success: boolean }>('/edits', body)

			expect(mockFetch).toHaveBeenCalledWith('/api/edits', {
				method: 'POST',
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' },
			})
			expect(result).toEqual({ success: true })
		})
	})
})
