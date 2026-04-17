import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { EntityTable } from '~/components/entity-table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { useEntities, useTypes } from '~/hooks/use-entities'
import { useDeleteEntities } from '~/hooks/use-mutations'

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0
const DEFAULT_SORT = 'updated_at'
const DEFAULT_ORDER = 'desc'

type SortColumn = 'updated_at' | 'created_at' | 'properties_text'
type SortOrder = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Batch Delete Dialog
// ---------------------------------------------------------------------------

function BatchDeleteDialog({
	selectedIds,
	open,
	onOpenChange,
	onSuccess,
}: {
	selectedIds: Set<string>
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}) {
	const deleteEntities = useDeleteEntities()

	async function handleConfirm() {
		if (deleteEntities.isLoading) return

		try {
			await deleteEntities.mutateAsync({ ids: [...selectedIds] })
			deleteEntities.reset()
			onOpenChange(false)
			onSuccess()
		} catch {
			// Error is captured in deleteEntities.error, dialog stays open
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			deleteEntities.reset()
		}
		onOpenChange(nextOpen)
	}

	const count = selectedIds.size

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Entities</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete <span className="font-medium">{count}</span>{' '}
						{count === 1 ? 'entity' : 'entities'}? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				{deleteEntities.error && (
					<div className="text-sm text-destructive" data-testid="batch-delete-error">
						{deleteEntities.error.message}
					</div>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={deleteEntities.isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={deleteEntities.isLoading}
						data-testid="confirm-batch-delete-button"
					>
						{deleteEntities.isLoading && <Spinner className="mr-1" />}
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/**
 * Entities page with type filter dropdown, pagination, and batch delete.
 * URL syncs ?type=, ?limit=, ?offset=
 */
export function EntitiesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	// Selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
	const lastClickedIndexRef = useRef<number | null>(null)

	// Parse URL params with defaults
	const typeFilter = searchParams.get('type') ?? undefined
	const limit = useMemo(() => {
		const raw = searchParams.get('limit')
		return raw ? Math.max(1, Number.parseInt(raw, 10) || DEFAULT_LIMIT) : DEFAULT_LIMIT
	}, [searchParams])
	const offset = useMemo(() => {
		const raw = searchParams.get('offset')
		return raw ? Math.max(0, Number.parseInt(raw, 10) || DEFAULT_OFFSET) : DEFAULT_OFFSET
	}, [searchParams])
	const sort = useMemo(() => {
		const raw = searchParams.get('sort')
		return raw === 'updated_at' || raw === 'created_at' || raw === 'properties_text'
			? raw
			: (DEFAULT_SORT as SortColumn)
	}, [searchParams])
	const order = useMemo(() => {
		const raw = searchParams.get('order')
		return raw === 'asc' || raw === 'desc' ? raw : (DEFAULT_ORDER as SortOrder)
	}, [searchParams])

	// Fetch entities with current filters
	const { entities, isLoading, isError, error, refetch } = useEntities({
		type: typeFilter,
		limit,
		offset,
		sort,
		order,
	})

	// Fetch available types for dropdown
	const { types, isLoading: isLoadingTypes } = useTypes()

	// Derive entities from current page
	const aliveEntities = useMemo(() => entities?.entities ?? [], [entities])

	// Clear selection on page change (track offset via ref for exhaustive-deps)
	const prevOffsetRef = useRef(offset)
	if (prevOffsetRef.current !== offset) {
		prevOffsetRef.current = offset
		setSelectedIds(new Set())
		lastClickedIndexRef.current = null
	}

	// Selection handlers
	const handleToggleSelection = useCallback(
		(id: string, shiftKey: boolean, index: number) => {
			// Capture ref before setState — React 18 batching runs the updater
			// asynchronously, so the ref would be stale if read inside the updater.
			const lastClickedIndex = lastClickedIndexRef.current

			setSelectedIds((prev) => {
				const next = new Set(prev)

				if (shiftKey && lastClickedIndex !== null) {
					// Range selection: select all entities between last clicked and current
					const start = Math.min(lastClickedIndex, index)
					const end = Math.max(lastClickedIndex, index)
					const allEntities = entities?.entities ?? []

					for (let i = start; i <= end; i++) {
						const entity = allEntities[i]
						if (entity) {
							next.add(entity.id)
						}
					}
				} else {
					// Single toggle
					if (next.has(id)) {
						next.delete(id)
					} else {
						next.add(id)
					}
				}

				return next
			})

			// Update last clicked index
			lastClickedIndexRef.current = index
		},
		[entities],
	)

	const handleToggleSelectAll = useCallback(() => {
		const aliveIds = new Set(aliveEntities.map((e) => e.id))
		const allSelected = aliveIds.size > 0 && [...aliveIds].every((id) => selectedIds.has(id))

		if (allSelected) {
			setSelectedIds((prev) => {
				const next = new Set(prev)
				for (const id of aliveIds) {
					next.delete(id)
				}
				return next
			})
		} else {
			setSelectedIds((prev) => {
				const next = new Set(prev)
				for (const id of aliveIds) {
					next.add(id)
				}
				return next
			})
		}
	}, [aliveEntities, selectedIds])

	// Batch delete success handler
	const handleBatchDeleteSuccess = useCallback(() => {
		setSelectedIds(new Set())
	}, [])

	// Update URL params
	const updateParams = (updates: {
		type?: string | null
		limit?: number
		offset?: number
		sort?: SortColumn
		order?: SortOrder
	}) => {
		const newParams = new URLSearchParams(searchParams)

		if (updates.type !== undefined) {
			if (updates.type === null || updates.type === '') {
				newParams.delete('type')
			} else {
				newParams.set('type', updates.type)
			}
		}

		if (updates.limit !== undefined) {
			newParams.set('limit', String(updates.limit))
		}

		if (updates.offset !== undefined) {
			if (updates.offset === 0) {
				newParams.delete('offset')
			} else {
				newParams.set('offset', String(updates.offset))
			}
		}

		if (updates.sort !== undefined) {
			if (updates.sort === DEFAULT_SORT) {
				newParams.delete('sort')
			} else {
				newParams.set('sort', updates.sort)
			}
		}

		if (updates.order !== undefined) {
			if (updates.order === DEFAULT_ORDER) {
				newParams.delete('order')
			} else {
				newParams.set('order', updates.order)
			}
		}

		setSearchParams(newParams, { replace: true })
	}

	// Handle type filter change
	const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newType = event.target.value
		updateParams({ type: newType || null, offset: 0 })
	}

	// Handle pagination change
	const handlePageChange = (newOffset: number) => {
		updateParams({ offset: newOffset })
	}

	// Handle sort change
	const handleSortChange = (newSort: SortColumn, newOrder: SortOrder) => {
		updateParams({ sort: newSort, order: newOrder, offset: 0 })
	}

	// Handle retry on error
	const handleRetry = () => {
		refetch()
	}

	// Sync default limit to URL on mount if not present
	useEffect(() => {
		if (!searchParams.has('limit')) {
			const newParams = new URLSearchParams(searchParams)
			newParams.set('limit', String(DEFAULT_LIMIT))
			setSearchParams(newParams, { replace: true })
		}
	}, [searchParams, setSearchParams])

	return (
		<Card>
			<CardHeader className="px-4">
				<div className="flex items-center justify-between">
					<CardTitle>Entities</CardTitle>
					<div className="flex items-center gap-2">
						{selectedIds.size > 0 && (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setBatchDeleteOpen(true)}
								data-testid="batch-delete-button"
							>
								Delete ({selectedIds.size})
							</Button>
						)}
						<Button
							size="sm"
							onClick={() => navigate('/entities/new')}
							data-testid="create-entity-button"
						>
							Create Entity
						</Button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
						Filter by type:
					</label>
					<select
						id="type-filter"
						value={typeFilter ?? ''}
						onChange={handleTypeChange}
						disabled={isLoadingTypes}
						className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option value="">All types</option>
						{types?.map((type) => (
							<option key={type.id} value={type.id}>
								{type.name ?? type.id.slice(0, 12)}
							</option>
						))}
					</select>
				</div>
			</CardHeader>

			{/* Error state */}
			{isError && (
				<Card className="bg-red-50 ring-red-200">
					<CardContent className="py-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-medium text-red-800">Failed to load entities</h3>
								<p className="text-sm text-red-600 mt-1">
									{error?.message || 'An unexpected error occurred'}
								</p>
							</div>
							<Button variant="destructive" size="sm" onClick={handleRetry}>
								Retry
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Loading state */}
			{isLoading && !isError && (
				<CardContent className="py-8">
					<div className="space-y-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				</CardContent>
			)}

			{/* Entity table */}
			{!isLoading && !isError && entities && (
				<CardContent>
					<EntityTable
						entities={entities.entities}
						total={entities.total}
						limit={limit}
						offset={offset}
						onPageChange={handlePageChange}
						currentSort={sort}
						currentOrder={order}
						onSortChange={handleSortChange}
						selectedIds={selectedIds}
						onToggleSelection={handleToggleSelection}
						onToggleSelectAll={handleToggleSelectAll}
					/>
				</CardContent>
			)}

			{/* Batch Delete Dialog */}
			<BatchDeleteDialog
				selectedIds={selectedIds}
				open={batchDeleteOpen}
				onOpenChange={setBatchDeleteOpen}
				onSuccess={handleBatchDeleteSuccess}
			/>
		</Card>
	)
}
