/**
 * Tests for mutation hooks
 * Tests cover: submit, poll, invalidate, timeout, cleanup, failed status
 *
 * Strategy: We test pollUntilSettled directly for polling logic (timeout, multiple polls)
 * and test hooks via mocked mutations that resolve immediately (no actual polling delay).
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

vi.mock('~/api/mutations', () => ({
	submitMutations: vi.fn(),
	getEdit: vi.fn(),
}))

vi.mock('~/hooks/use-entities', () => ({
	entityKeys: {
		all: ['entities'],
		detail: (id: string) => ['entities', 'detail', id],
		list: (params: unknown) => ['entities', 'list', params],
		relations: (id: string, params: unknown) => ['entities', 'relations', id, params],
		types: () => ['entities', 'types'],
	},
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { getEdit, submitMutations } from '~/api/mutations'
import { entityKeys } from '~/hooks/use-entities'
import {
	pollUntilSettled,
	useCreateEntity,
	useCreateRelation,
	useDeleteEntities,
	useDeleteEntity,
	useDeleteRelation,
	useUpdateEntity,
} from '~/hooks/use-mutations'

const mockGetEdit = vi.mocked(getEdit)
const mockSubmitMutations = vi.mocked(submitMutations)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false },
		},
	})
}

function createWrapper(client: QueryClient = createQueryClient()) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client }, children)
	}
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const APPLIED_EDIT = {
	id: 'edit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
	spaceId: 'space-id',
	author: 'author-id',
	name: 'Create entity',
	status: 'applied' as const,
	opCount: 3,
	createdAt: '2024-01-01T00:00:00Z',
	appliedAt: '2024-01-01T00:00:01Z',
	errorMsg: null,
	decodedOps: null as import('~/api/types').DecodedOp[] | null,
}

const FAILED_EDIT = {
	...APPLIED_EDIT,
	status: 'failed' as const,
	appliedAt: null,
	errorMsg: 'Entity not found on chain',
}

const BUILD_RESPONSE = {
	id: 'edit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
	name: 'Create entity',
	opCount: 3,
	entityIds: ['entity-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-mutations', () => {
	beforeEach(() => {
		mockSubmitMutations.mockReset()
		mockGetEdit.mockReset()
	})

	// ========================================================================
	// useCreateEntity
	// ========================================================================

	describe('useCreateEntity', () => {
		it('submits createEntity mutation and resolves on first poll', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({ name: 'Test Entity' })
			})

			// Wait for mutation to fully complete (data populated)
			await waitFor(
				() => {
					expect(result.current.data).toBeDefined()
				},
				{ timeout: 2000 },
			)

			expect(mockSubmitMutations).toHaveBeenCalledWith({
				mutations: [{ type: 'createEntity', params: { name: 'Test Entity' } }],
			})
			expect(result.current.data?.id).toBe('edit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
			expect(result.current.error).toBeNull()
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('invalidates entity queries on success', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({ name: 'Test' })
			})

			await waitFor(() => {
				expect(result.current.data).toBeDefined()
			})

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('returns error when edit status is failed', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ name: 'Test' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})

		it('sets isLoading during mutation', async () => {
			// Use a deferred promise so we can control when the mutation resolves
			let resolveMutation!: (value: unknown) => void
			const deferredPromise = new Promise<unknown>((resolve) => {
				resolveMutation = resolve
			})
			mockSubmitMutations.mockReturnValueOnce(deferredPromise as never)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			// Initially idle
			expect(result.current.isLoading).toBe(false)
			expect(result.current.error).toBeNull()

			result.current.mutate({ name: 'Test' })

			// Flush React state updates — mutation should now be pending
			await waitFor(() => {
				expect(result.current.isLoading).toBe(true)
			})

			// Now resolve the mutation
			await act(async () => {
				resolveMutation(BUILD_RESPONSE)
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})
		})

		it('submits with types and values', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({
					name: 'Test',
					types: ['Person'],
					values: [{ property: 'prop1', type: 'text', value: 'hello' }],
				})
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
				mutations: [
					{
						type: 'createEntity',
						params: {
							name: 'Test',
							types: ['Person'],
							values: [{ property: 'prop1', type: 'text', value: 'hello' }],
						},
					},
				],
			})
		})

		it('propagates submitMutations error as mutation error', async () => {
			mockSubmitMutations.mockRejectedValueOnce(new Error('Network error'))

			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ name: 'Test' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Network error')
		})

		it('handles failed edit with null errorMsg', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce({ ...FAILED_EDIT, errorMsg: null })

			const { result } = renderHook(() => useCreateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ name: 'Test' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toContain('Mutation failed for edit')
		})
	})

	// ========================================================================
	// useUpdateEntity
	// ========================================================================

	describe('useUpdateEntity', () => {
		it('submits updateEntity mutation with id, name, values, unset', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useUpdateEntity(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({
					id: 'entity-id',
					name: 'Updated Name',
					values: [{ property: 'prop1', type: 'text', value: 'new' }],
					unset: [{ property: 'old-prop' }],
				})
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
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
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('returns error on failed edit status', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useUpdateEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ id: 'entity-id' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})
	})

	// ========================================================================
	// useDeleteEntity
	// ========================================================================

	describe('useDeleteEntity', () => {
		it('submits deleteEntity mutation with id', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useDeleteEntity(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({ id: 'entity-id' })
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
				mutations: [{ type: 'deleteEntity', params: { id: 'entity-id' } }],
			})
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('returns error on failed edit status', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useDeleteEntity(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ id: 'entity-id' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})
	})

	// ========================================================================
	// useDeleteEntities (batch)
	// ========================================================================

	describe('useDeleteEntities', () => {
		it('maps each id to a deleteEntity mutation in a single call', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ ids: ['a', 'b', 'c'] })
			})

			await waitFor(() => {
				expect(result.current.data).toBeDefined()
			})

			expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			const callArgs = mockSubmitMutations.mock.calls[0][0]
			expect(callArgs.mutations).toHaveLength(3)
			expect(callArgs.mutations).toEqual([
				{ type: 'deleteEntity', params: { id: 'a' } },
				{ type: 'deleteEntity', params: { id: 'b' } },
				{ type: 'deleteEntity', params: { id: 'c' } },
			])
		})

		it('polls until settled and resolves on applied', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ ids: ['a', 'b'] })
			})

			await waitFor(() => {
				expect(result.current.data).toBeDefined()
			})

			expect(result.current.data?.id).toBe('edit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
			expect(result.current.error).toBeNull()
		})

		it('invalidates entityKeys.all on success', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({ ids: ['a'] })
			})

			await waitFor(() => {
				expect(result.current.data).toBeDefined()
			})

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('surfaces error when edit status is failed', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ ids: ['a', 'b'] })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})

		it('surfaces submitMutations network error', async () => {
			mockSubmitMutations.mockRejectedValueOnce(new Error('Network error'))

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ ids: ['a'] })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Network error')
		})

		it('shows isLoading during mutation, false after completion', async () => {
			let resolveMutation!: (value: unknown) => void
			const deferredPromise = new Promise<unknown>((resolve) => {
				resolveMutation = resolve
			})
			mockSubmitMutations.mockReturnValueOnce(deferredPromise as never)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			expect(result.current.isLoading).toBe(false)

			result.current.mutate({ ids: ['a'] })

			await waitFor(() => {
				expect(result.current.isLoading).toBe(true)
			})

			await act(async () => {
				resolveMutation(BUILD_RESPONSE)
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})
		})

		it('aborts in-flight mutation on unmount', async () => {
			const deferredPromise = new Promise<unknown>(() => {})
			mockSubmitMutations.mockReturnValueOnce(deferredPromise as never)

			const { result, unmount } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			result.current.mutate({ ids: ['a'] })

			await waitFor(() => {
				expect(result.current.isLoading).toBe(true)
			})

			// Unmount while mutation is in-flight
			unmount()

			// The abort should prevent polling from continuing.
			// Verify no further getEdit calls after unmount.
			await new Promise((r) => setTimeout(r, 100))
			expect(mockGetEdit).not.toHaveBeenCalled()
		})

		it('aborts previous mutation when new one is invoked', async () => {
			// First mutation never resolves (simulates in-flight)
			const firstPromise = new Promise<unknown>(() => {})

			// Second mutation resolves successfully
			let resolveSecond!: (value: unknown) => void
			const secondPromise = new Promise<unknown>((resolve) => {
				resolveSecond = resolve
			})

			mockSubmitMutations
				.mockReturnValueOnce(firstPromise as never)
				.mockReturnValueOnce(secondPromise as never)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const { result } = renderHook(() => useDeleteEntities(), {
				wrapper: createWrapper(createQueryClient()),
			})

			// First mutation starts — never resolves
			result.current.mutate({ ids: ['a'] })
			await waitFor(() => {
				expect(result.current.isLoading).toBe(true)
			})

			// Second mutation replaces the first (first AbortController is aborted)
			await act(async () => {
				result.current.mutate({ ids: ['b', 'c'] })
			})

			// Resolve the second mutation
			await act(async () => {
				resolveSecond(BUILD_RESPONSE)
			})

			// Second mutation completes successfully
			await waitFor(() => {
				expect(result.current.data).toBeDefined()
				expect(result.current.isLoading).toBe(false)
			})

			// Verify the second call was the one that went through
			expect(mockSubmitMutations).toHaveBeenCalledTimes(2)
			const secondCallArgs = mockSubmitMutations.mock.calls[1][0]
			expect(secondCallArgs.mutations).toHaveLength(2)
			expect(secondCallArgs.mutations).toEqual([
				{ type: 'deleteEntity', params: { id: 'b' } },
				{ type: 'deleteEntity', params: { id: 'c' } },
			])
		})
	})

	// ========================================================================
	// useCreateRelation
	// ========================================================================

	describe('useCreateRelation', () => {
		it('submits createRelation mutation and invalidates both entities', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useCreateRelation(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({
					fromEntity: 'entity-a',
					toEntity: 'entity-b',
					type: 'relation-type-id',
				})
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
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
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: entityKeys.detail('entity-a'),
			})
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: entityKeys.detail('entity-b'),
			})
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('returns error on failed edit status', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useCreateRelation(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ fromEntity: 'a', toEntity: 'b', type: 't' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})
	})

	// ========================================================================
	// useDeleteRelation
	// ========================================================================

	describe('useDeleteRelation', () => {
		it('submits deleteRelation mutation and invalidates parent entity', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(APPLIED_EDIT)

			const client = createQueryClient()
			const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
			const { result } = renderHook(() => useDeleteRelation(), {
				wrapper: createWrapper(client),
			})

			await act(async () => {
				result.current.mutate({
					id: 'relation-id',
					entityId: 'parent-entity-id',
				})
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
				expect(result.current.error).toBeNull()
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
				mutations: [{ type: 'deleteRelation', params: { id: 'relation-id' } }],
			})
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: entityKeys.detail('parent-entity-id'),
			})
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: entityKeys.all })
		})

		it('returns error on failed edit status', async () => {
			mockSubmitMutations.mockResolvedValueOnce(BUILD_RESPONSE)
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			const { result } = renderHook(() => useDeleteRelation(), {
				wrapper: createWrapper(createQueryClient()),
			})

			await act(async () => {
				result.current.mutate({ id: 'rel-id', entityId: 'entity-id' })
			})

			await waitFor(() => expect(result.current.error).toBeTruthy())
			expect(result.current.error?.message).toBe('Entity not found on chain')
		})
	})

	// ========================================================================
	// pollUntilSettled — unit tests for polling logic (real timers, no React)
	// ========================================================================

	describe('pollUntilSettled', () => {
		it('times out after configured timeout', async () => {
			mockGetEdit.mockResolvedValue({
				...APPLIED_EDIT,
				status: 'pending',
				appliedAt: null,
			})

			await expect(pollUntilSettled('edit-id', { timeoutMs: 100, intervalMs: 30 })).rejects.toThrow(
				'timed out',
			)
		})

		it('stops polling after timeout (no more getEdit calls)', async () => {
			mockGetEdit.mockResolvedValue({
				...APPLIED_EDIT,
				status: 'pending',
				appliedAt: null,
			})

			const pollPromise = pollUntilSettled('edit-id', {
				timeoutMs: 100,
				intervalMs: 30,
			})

			await expect(pollPromise).rejects.toThrow()

			const callsAfterTimeout = mockGetEdit.mock.calls.length

			// Wait a bit longer — no new calls should appear
			await new Promise((r) => setTimeout(r, 150))
			expect(mockGetEdit.mock.calls.length).toBe(callsAfterTimeout)
		})

		it('polls multiple times before applied', async () => {
			mockGetEdit
				.mockResolvedValueOnce({ ...APPLIED_EDIT, status: 'pending', appliedAt: null })
				.mockResolvedValueOnce({ ...APPLIED_EDIT, status: 'pending', appliedAt: null })
				.mockResolvedValueOnce(APPLIED_EDIT)

			const result = await pollUntilSettled('edit-id', {
				timeoutMs: 10_000,
				intervalMs: 10,
			})

			expect(mockGetEdit).toHaveBeenCalledTimes(3)
			expect(result.id).toBe('edit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
		})

		it('throws error on failed status with errorMsg', async () => {
			mockGetEdit.mockResolvedValueOnce(FAILED_EDIT)

			await expect(
				pollUntilSettled('edit-id', { timeoutMs: 10_000, intervalMs: 10 }),
			).rejects.toThrow('Entity not found on chain')
		})

		it('throws default error on failed status without errorMsg', async () => {
			mockGetEdit.mockResolvedValueOnce({ ...FAILED_EDIT, errorMsg: null })

			await expect(
				pollUntilSettled('edit-id', { timeoutMs: 10_000, intervalMs: 10 }),
			).rejects.toThrow('Mutation failed for edit')
		})

		it('stops polling when AbortSignal is triggered', async () => {
			mockGetEdit.mockResolvedValue({
				...APPLIED_EDIT,
				status: 'pending',
				appliedAt: null,
			})

			const controller = new AbortController()
			setTimeout(() => controller.abort(), 50)

			await expect(
				pollUntilSettled('edit-id', {
					timeoutMs: 10_000,
					intervalMs: 10,
					signal: controller.signal,
				}),
			).rejects.toThrow('Aborted')
		})
	})
})
