/**
 * TanStack Query mutation hooks for Knowledge Graph Explorer
 * Each hook: submits mutation → polls getEdit until applied/failed → invalidates queries
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { getEdit, submitMutations } from '~/api/mutations'
import type {
	BuildResponse,
	CreateEntityParams,
	Mutation,
	UpdateEntityParams,
} from '~/api/mutations'
import { entityKeys } from '~/hooks/use-entities'

// ---------------------------------------------------------------------------
// Polling Configuration
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 60_000

// ---------------------------------------------------------------------------
// Shared Polling Logic
// ---------------------------------------------------------------------------

/**
 * Poll getEdit until status reaches a terminal state (applied or failed).
 * Returns the final edit on success, throws on failure/timeout.
 * Respects AbortSignal for cleanup on component unmount.
 */
export async function pollUntilSettled(
	editId: string,
	options: {
		intervalMs?: number
		timeoutMs?: number
		signal?: AbortSignal
	} = {},
): Promise<BuildResponse> {
	const { intervalMs = POLL_INTERVAL_MS, timeoutMs = POLL_TIMEOUT_MS, signal } = options
	const startTime = Date.now()

	const sleep = (ms: number) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms)
			signal?.addEventListener(
				'abort',
				() => {
					clearTimeout(timer)
					reject(new DOMException('Aborted', 'AbortError'))
				},
				{ once: true },
			)
		})

	while (true) {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError')
		}

		const elapsed = Date.now() - startTime
		if (elapsed >= timeoutMs) {
			throw new Error(
				`Mutation polling timed out after ${Math.round(timeoutMs / 1000)}s. Edit ${editId} is still pending.`,
			)
		}

		const edit = await getEdit(editId)

		if (edit.status === 'applied') {
			return { id: edit.id, name: edit.name, opCount: edit.opCount, entityIds: [] }
		}

		if (edit.status === 'failed') {
			throw new Error(edit.errorMsg || `Mutation failed for edit ${editId}`)
		}

		// Still pending/processing — wait and retry
		await sleep(intervalMs)
	}
}

// ---------------------------------------------------------------------------
// Shared submit + poll
// ---------------------------------------------------------------------------

async function submitAndPoll(
	mutationPayload: Mutation,
	signal?: AbortSignal,
): Promise<BuildResponse> {
	const response = await submitMutations({ mutations: [mutationPayload] })
	return pollUntilSettled(response.id, { signal })
}

// ---------------------------------------------------------------------------
// Common Return Type
// ---------------------------------------------------------------------------

interface MutationHookReturn<TParams> {
	mutate: (params: TParams) => void
	mutateAsync: (params: TParams) => Promise<BuildResponse>
	isLoading: boolean
	error: Error | null
	reset: () => void
	data: BuildResponse | undefined
}

/**
 * Map TanStack Query useMutation result to our MutationHookReturn.
 * Aliases isPending → isLoading for ergonomics in UI components.
 */
function mapMutationResult<TParams>(mutation: {
	mutate: unknown
	mutateAsync: unknown
	isPending: boolean
	error: Error | null
	reset: () => void
	data: unknown
}): MutationHookReturn<TParams> {
	return {
		mutate: mutation.mutate as MutationHookReturn<TParams>['mutate'],
		mutateAsync: mutation.mutateAsync as MutationHookReturn<TParams>['mutateAsync'],
		isLoading: mutation.isPending,
		error: mutation.error,
		reset: mutation.reset,
		data: mutation.data as BuildResponse | undefined,
	}
}

// ---------------------------------------------------------------------------
// AbortController helper for mutation cleanup
// ---------------------------------------------------------------------------

/**
 * Returns a ref-backed AbortController that aborts on component unmount.
 * Each mutation call creates a new controller (aborting any previous one).
 */
function useMutationAbort() {
	const abortRef = useRef<AbortController | null>(null)

	useEffect(() => {
		return () => {
			abortRef.current?.abort()
		}
	}, [])

	return abortRef
}

// ---------------------------------------------------------------------------
// useCreateEntity
// ---------------------------------------------------------------------------

export interface UseCreateEntityParams {
	name?: string
	description?: string
	values?: CreateEntityParams['values']
	types?: string[]
}

/**
 * Create a new entity. Polls until applied, then invalidates entity list queries.
 */
export function useCreateEntity(): MutationHookReturn<UseCreateEntityParams> {
	const queryClient = useQueryClient()
	const abortRef = useMutationAbort()

	const mutation = useMutation({
		mutationFn: (params: UseCreateEntityParams) => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			return submitAndPoll({ type: 'createEntity', params }, controller.signal)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.all })
		},
	})

	return mapMutationResult(mutation)
}

// ---------------------------------------------------------------------------
// useUpdateEntity
// ---------------------------------------------------------------------------

export interface UseUpdateEntityParams {
	id: string
	name?: string
	description?: string
	values?: UpdateEntityParams['values']
	unset?: UpdateEntityParams['unset']
}

/**
 * Update an existing entity. Polls until applied, then invalidates entity queries
 * (including detail).
 */
export function useUpdateEntity(): MutationHookReturn<UseUpdateEntityParams> {
	const queryClient = useQueryClient()
	const abortRef = useMutationAbort()

	const mutation = useMutation({
		mutationFn: (params: UseUpdateEntityParams) => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			return submitAndPoll({ type: 'updateEntity', params }, controller.signal)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.all })
		},
	})

	return mapMutationResult(mutation)
}

// ---------------------------------------------------------------------------
// useDeleteEntity
// ---------------------------------------------------------------------------

export interface UseDeleteEntityParams {
	id: string
}

/**
 * Delete an entity. Polls until applied, then invalidates entity queries.
 */
export function useDeleteEntity(): MutationHookReturn<UseDeleteEntityParams> {
	const queryClient = useQueryClient()
	const abortRef = useMutationAbort()

	const mutation = useMutation({
		mutationFn: (params: UseDeleteEntityParams) => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			return submitAndPoll({ type: 'deleteEntity', params: { id: params.id } }, controller.signal)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.all })
		},
	})

	return mapMutationResult(mutation)
}

// ---------------------------------------------------------------------------
// useCreateRelation
// ---------------------------------------------------------------------------

export interface UseCreateRelationParams {
	fromEntity: string
	toEntity: string
	type: string
}

/**
 * Create a relation between entities. Polls until applied, then invalidates
 * detail queries for both entities.
 */
export function useCreateRelation(): MutationHookReturn<UseCreateRelationParams> {
	const queryClient = useQueryClient()
	const abortRef = useMutationAbort()

	const mutation = useMutation({
		mutationFn: (params: UseCreateRelationParams) => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			return submitAndPoll(
				{
					type: 'createRelation',
					params: {
						fromEntity: params.fromEntity,
						toEntity: params.toEntity,
						type: params.type,
					},
				},
				controller.signal,
			)
		},
		onSuccess: (_data, params) => {
			queryClient.invalidateQueries({ queryKey: entityKeys.detail(params.fromEntity) })
			queryClient.invalidateQueries({ queryKey: entityKeys.detail(params.toEntity) })
			queryClient.invalidateQueries({ queryKey: entityKeys.all })
		},
	})

	return mapMutationResult(mutation)
}

// ---------------------------------------------------------------------------
// useDeleteRelation
// ---------------------------------------------------------------------------

export interface UseDeleteRelationParams {
	id: string
	entityId: string
}

/**
 * Delete a relation. Polls until applied, then invalidates the parent entity's
 * detail query.
 */
export function useDeleteRelation(): MutationHookReturn<UseDeleteRelationParams> {
	const queryClient = useQueryClient()
	const abortRef = useMutationAbort()

	const mutation = useMutation({
		mutationFn: (params: UseDeleteRelationParams) => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			return submitAndPoll({ type: 'deleteRelation', params: { id: params.id } }, controller.signal)
		},
		onSuccess: (_data, params) => {
			queryClient.invalidateQueries({ queryKey: entityKeys.detail(params.entityId) })
			queryClient.invalidateQueries({ queryKey: entityKeys.all })
		},
	})

	return mapMutationResult(mutation)
}
