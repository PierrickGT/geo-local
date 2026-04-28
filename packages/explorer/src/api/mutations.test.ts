/**
 * Tests for Mutation API Client
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { getEdit, submitMutations } from './mutations'
import type { BuildBody, BuildResponse, CreateEntityParams } from './mutations'
import type { Edit } from './types'

// Mock fetch globally for submitMutations
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock the client module for getEdit (which uses get from client)
vi.mock('./client', async () => {
	const actual = await vi.importActual<typeof import('./client')>('./client')
	return {
		...actual,
		get: vi.fn(),
	}
})
import { get } from './client'

const mockGet = vi.mocked(get)

describe('mutations API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockFetch.mockReset()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('submitMutations', () => {
		it('posts JSON to /ingest/edits/build with correct Content-Type', async () => {
			const mockResponse: BuildResponse = {
				id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				name: 'Create entity',
				opCount: 3,
				entityIds: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
			}
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const body: BuildBody = {
				name: 'Create entity',
				mutations: [
					{
						type: 'createEntity',
						params: {
							name: 'Test Entity',
							description: 'A test',
							types: ['Person'],
						},
					},
				],
			}

			const result = await submitMutations(body)

			expect(mockFetch).toHaveBeenCalledWith('/ingest/edits/build', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			expect(result).toEqual(mockResponse)
		})

		it('posts createEntity mutation with values', async () => {
			const mockResponse: BuildResponse = {
				id: 'edit-id-00000000000000000000000000',
				name: '',
				opCount: 4,
				entityIds: ['entity-id-000000000000000000000'],
			}
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const params: CreateEntityParams = {
				name: 'Test Entity',
				values: [
					{ property: 'prop1', type: 'text', value: 'hello' },
					{ property: 'prop2', type: 'number', value: 42 },
					{ property: 'prop3', type: 'boolean', value: true },
				],
			}

			const result = await submitMutations({
				mutations: [{ type: 'createEntity', params }],
			})

			expect(result.id).toBe('edit-id-00000000000000000000000000')
			expect(result.entityIds).toHaveLength(1)

			// Verify the body was serialized correctly
			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.mutations[0].params.values).toEqual([
				{ property: 'prop1', type: 'text', value: 'hello' },
				{ property: 'prop2', type: 'number', value: 42 },
				{ property: 'prop3', type: 'boolean', value: true },
			])
		})

		it('posts updateEntity mutation with values and unset', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'edit-id',
						name: '',
						opCount: 2,
						entityIds: ['entity-id'],
					}),
			})

			await submitMutations({
				mutations: [
					{
						type: 'updateEntity',
						params: {
							id: 'entity-id',
							name: 'Updated Name',
							values: [{ property: 'prop1', type: 'text', value: 'new' }],
							unset: [{ property: 'old-prop' }],
						},
					},
				],
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.mutations[0].type).toBe('updateEntity')
			expect(callBody.mutations[0].params.id).toBe('entity-id')
			expect(callBody.mutations[0].params.name).toBe('Updated Name')
			expect(callBody.mutations[0].params.values).toEqual([
				{ property: 'prop1', type: 'text', value: 'new' },
			])
			expect(callBody.mutations[0].params.unset).toEqual([{ property: 'old-prop' }])
		})

		it('posts deleteEntity mutation', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'edit-id',
						name: '',
						opCount: 1,
						entityIds: ['entity-id'],
					}),
			})

			await submitMutations({
				mutations: [{ type: 'deleteEntity', params: { id: 'entity-id' } }],
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.mutations[0]).toEqual({
				type: 'deleteEntity',
				params: { id: 'entity-id' },
			})
		})

		it('posts createRelation mutation', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'edit-id',
						name: '',
						opCount: 1,
						entityIds: [],
					}),
			})

			await submitMutations({
				mutations: [
					{
						type: 'createRelation',
						params: {
							fromEntity: 'entity-a',
							toEntity: 'entity-b',
							type: 'relation-type-id',
						},
					},
				],
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.mutations[0]).toEqual({
				type: 'createRelation',
				params: {
					fromEntity: 'entity-a',
					toEntity: 'entity-b',
					type: 'relation-type-id',
				},
			})
		})

		it('posts deleteRelation mutation', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'edit-id',
						name: '',
						opCount: 1,
						entityIds: [],
					}),
			})

			await submitMutations({
				mutations: [{ type: 'deleteRelation', params: { id: 'relation-id' } }],
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.mutations[0]).toEqual({
				type: 'deleteRelation',
				params: { id: 'relation-id' },
			})
		})

		it('throws ApiError on 400 response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: 'Bad Request',
				json: () => Promise.resolve({ error: 'mutations array is required' }),
			})

			try {
				await submitMutations({ mutations: [] })
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError)
				expect((error as ApiError).status).toBe(400)
				expect((error as ApiError).getApiMessage()).toBe('mutations array is required')
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
				await submitMutations({ mutations: [{ type: 'createEntity', params: {} }] })
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError)
				expect((error as ApiError).status).toBe(500)
				expect((error as ApiError).data).toEqual({})
			}
		})

		it('throws ApiError on network error (TypeError)', async () => {
			mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

			try {
				await submitMutations({ mutations: [{ type: 'createEntity', params: {} }] })
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError)
				expect((error as ApiError).status).toBe(0)
				expect((error as ApiError).message).toBe(
					'Network error: Unable to connect to ingest server.',
				)
			}
		})

		it('rethrows non-TypeError network errors', async () => {
			const customError = new Error('Custom error')
			mockFetch.mockRejectedValueOnce(customError)

			try {
				await submitMutations({ mutations: [{ type: 'createEntity', params: {} }] })
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBe(customError)
			}
		})

		it('includes optional name and author in request body', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({ id: 'edit-id', name: 'Test Edit', opCount: 1, entityIds: [] }),
			})

			await submitMutations({
				name: 'Test Edit',
				author: 'user-id',
				mutations: [{ type: 'createEntity', params: { name: 'Entity' } }],
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(callBody.name).toBe('Test Edit')
			expect(callBody.author).toBe('user-id')
		})
	})

	describe('getEdit', () => {
		it('fetches single edit by ID', async () => {
			const mockEdit: Edit = {
				id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				spaceId: 'space-id',
				author: 'author-id',
				name: 'Create entity',
				status: 'applied',
				opCount: 3,
				createdAt: '2024-01-01T00:00:00Z',
				appliedAt: '2024-01-01T00:00:01Z',
				errorMsg: null,
				decodedOps: null,
			}
			mockGet.mockResolvedValueOnce(mockEdit)

			const result = await getEdit('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

			expect(mockGet).toHaveBeenCalledWith('/edits/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
			expect(result).toEqual(mockEdit)
			expect(result.status).toBe('applied')
		})

		it('fetches pending edit', async () => {
			const mockEdit: Edit = {
				id: 'edit-id',
				spaceId: 'space-id',
				author: 'author-id',
				name: 'Create entity',
				status: 'pending',
				opCount: 1,
				createdAt: '2024-01-01T00:00:00Z',
				appliedAt: null,
				errorMsg: null,
				decodedOps: null,
			}
			mockGet.mockResolvedValueOnce(mockEdit)

			const result = await getEdit('edit-id')

			expect(result.status).toBe('pending')
			expect(result.appliedAt).toBeNull()
		})

		it('fetches failed edit with error message', async () => {
			const mockEdit: Edit = {
				id: 'edit-id',
				spaceId: 'space-id',
				author: 'author-id',
				name: 'Create entity',
				status: 'failed',
				opCount: 1,
				createdAt: '2024-01-01T00:00:00Z',
				appliedAt: null,
				errorMsg: 'Entity not found on chain',
				decodedOps: null,
			}
			mockGet.mockResolvedValueOnce(mockEdit)

			const result = await getEdit('edit-id')

			expect(result.status).toBe('failed')
			expect(result.errorMsg).toBe('Entity not found on chain')
		})

		it('propagates ApiError from get on 404', async () => {
			mockGet.mockRejectedValueOnce(
				new ApiError(404, 'API Error: 404 Not Found', { error: 'Not found' }),
			)

			await expect(getEdit('nonexistent')).rejects.toThrow(ApiError)
			expect(mockGet).toHaveBeenCalledWith('/edits/nonexistent')
		})
	})
})
