/**
 * Tests for Entity API Endpoints
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get } from './client'
import { getEntities, getEntity, getEntityRelations } from './entities'

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

describe('entities API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('getEntities', () => {
		it('fetches entities without params', async () => {
			const mockResponse = {
				entities: [
					{
						id: 'entity-1',
						status: 'alive' as const,
						createdAt: '2024-01-01',
						updatedAt: '2024-01-01',
					},
				],
				total: 1,
				limit: 20,
				offset: 0,
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			const result = await getEntities()

			expect(mockGet).toHaveBeenCalledWith('/entities')
			expect(result).toEqual(mockResponse)
		})

		it('fetches entities with type filter', async () => {
			const mockResponse = {
				entities: [],
				total: 0,
				limit: 20,
				offset: 0,
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntities({ type: 'person' })

			expect(mockGet).toHaveBeenCalledWith('/entities?type=person')
		})

		it('fetches entities with pagination params', async () => {
			const mockResponse = {
				entities: [],
				total: 100,
				limit: 50,
				offset: 50,
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntities({ limit: 50, offset: 50 })

			expect(mockGet).toHaveBeenCalledWith('/entities?limit=50&offset=50')
		})

		it('fetches entities with all params', async () => {
			const mockResponse = {
				entities: [],
				total: 10,
				limit: 10,
				offset: 0,
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntities({ type: 'document', limit: 10, offset: 0 })

			expect(mockGet).toHaveBeenCalledWith('/entities?type=document&limit=10&offset=0')
		})

		it('throws ApiError on failure', async () => {
			mockGet.mockRejectedValueOnce(new ApiError(500, 'Server error', { error: 'Internal error' }))

			await expect(getEntities()).rejects.toThrow(ApiError)
		})
	})

	describe('getEntity', () => {
		it('fetches entity by ID', async () => {
			const mockResponse = {
				entity: {
					id: 'entity-123',
					status: 'alive' as const,
					createdAt: '2024-01-01',
					updatedAt: '2024-01-01',
					triples: [],
					outgoing: [],
					incoming: [],
				},
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			const result = await getEntity('entity-123')

			expect(mockGet).toHaveBeenCalledWith('/entities/entity-123')
			expect(result).toEqual(mockResponse)
		})

		it('URL encodes entity ID', async () => {
			const mockResponse = {
				entity: {
					id: 'entity/slash',
					status: 'alive' as const,
					createdAt: '2024-01-01',
					updatedAt: '2024-01-01',
					triples: [],
					outgoing: [],
					incoming: [],
				},
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntity('entity/slash')

			expect(mockGet).toHaveBeenCalledWith('/entities/entity%2Fslash')
		})

		it('throws ApiError on 404', async () => {
			mockGet.mockRejectedValueOnce(new ApiError(404, 'Not found', { error: 'Entity not found' }))

			await expect(getEntity('nonexistent')).rejects.toThrow(ApiError)
		})
	})

	describe('getEntityRelations', () => {
		it('fetches relations without params', async () => {
			const mockResponse = {
				relations: [
					{
						fromId: 'entity-1',
						toId: 'entity-2',
						relationType: 'KNOWS',
						status: 'alive' as const,
						createdAt: '2024-01-01',
					},
				],
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			const result = await getEntityRelations('entity-1')

			expect(mockGet).toHaveBeenCalledWith('/entities/entity-1/relations')
			expect(result).toEqual(mockResponse)
		})

		it('fetches outgoing relations', async () => {
			const mockResponse = { relations: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntityRelations('entity-1', { direction: 'outgoing' })

			expect(mockGet).toHaveBeenCalledWith('/entities/entity-1/relations?direction=outgoing')
		})

		it('fetches incoming relations', async () => {
			const mockResponse = { relations: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntityRelations('entity-1', { direction: 'incoming' })

			expect(mockGet).toHaveBeenCalledWith('/entities/entity-1/relations?direction=incoming')
		})

		it('filters by relation type', async () => {
			const mockResponse = { relations: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntityRelations('entity-1', { type: 'KNOWS' })

			expect(mockGet).toHaveBeenCalledWith('/entities/entity-1/relations?type=KNOWS')
		})

		it('filters by direction and type', async () => {
			const mockResponse = { relations: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntityRelations('entity-1', { direction: 'outgoing', type: 'KNOWS' })

			expect(mockGet).toHaveBeenCalledWith(
				'/entities/entity-1/relations?direction=outgoing&type=KNOWS',
			)
		})

		it('URL encodes entity ID', async () => {
			const mockResponse = { relations: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEntityRelations('entity/slash')

			expect(mockGet).toHaveBeenCalledWith('/entities/entity%2Fslash/relations')
		})
	})
})
