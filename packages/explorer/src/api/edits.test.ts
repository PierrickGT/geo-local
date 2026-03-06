/**
 * Tests for Edits API Endpoints
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get } from './client'
import { getEdits } from './edits'

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

describe('edits API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('getEdits', () => {
		it('fetches edits without params', async () => {
			const mockResponse = {
				edits: [
					{
						id: 'edit-1',
						spaceId: 'space-1',
						author: 'user-1',
						name: 'Create entity',
						status: 'applied' as const,
						opCount: 1,
						createdAt: '2024-01-01',
						appliedAt: '2024-01-01',
						errorMsg: null,
					},
				],
			}
			mockGet.mockResolvedValueOnce(mockResponse)

			const result = await getEdits()

			expect(mockGet).toHaveBeenCalledWith('/edits')
			expect(result).toEqual(mockResponse)
		})

		it('fetches edits filtered by status', async () => {
			const mockResponse = { edits: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEdits({ status: 'pending' })

			expect(mockGet).toHaveBeenCalledWith('/edits?status=pending')
		})

		it('fetches edits with limit', async () => {
			const mockResponse = { edits: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEdits({ limit: 50 })

			expect(mockGet).toHaveBeenCalledWith('/edits?limit=50')
		})

		it('fetches edits with status and limit', async () => {
			const mockResponse = { edits: [] }
			mockGet.mockResolvedValueOnce(mockResponse)

			await getEdits({ status: 'failed', limit: 20 })

			expect(mockGet).toHaveBeenCalledWith('/edits?status=failed&limit=20')
		})

		it('supports all status values', async () => {
			const statuses = ['pending', 'processing', 'applied', 'failed'] as const
			const mockResponse = { edits: [] }
			mockGet.mockResolvedValue(mockResponse)

			for (const status of statuses) {
				await getEdits({ status })
				expect(mockGet).toHaveBeenCalledWith(`/edits?status=${status}`)
			}
		})

		it('throws ApiError on failure', async () => {
			mockGet.mockRejectedValueOnce(new ApiError(500, 'Server error', { error: 'Internal error' }))

			await expect(getEdits()).rejects.toThrow(ApiError)
		})
	})
})
