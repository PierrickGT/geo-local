import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { EntityTable } from '~/components/entity-table'
import { Button } from '~/components/ui/button'
import { Chip } from '~/components/ui/chip'
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
type FilterType = 'all' | string

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
 * Entities page with Graphite design: filter bar with chips,
 * 6-column grid table, selection, bulk actions, pagination.
 * URL syncs ?type=, ?limit=, ?offset=, ?sort=, ?order=
 */
export function EntitiesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	// Selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
	const lastClickedIndexRef = useRef<number | null>(null)

	// Search query state
	const [query, setQuery] = useState(searchParams.get('q') ?? '')

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
	// Note: 'entities' is a virtual type filter — don't send it to the API
	const apiTypeFilter = typeFilter === 'entities' ? undefined : typeFilter
	const { entities, isLoading, isError, error, refetch } = useEntities({
		type: apiTypeFilter,
		limit,
		offset,
		sort,
		order,
	})

	// Fetch available types for chips
	const { types } = useTypes()

	// Compute type entities for chips
	const entityType = types.find((t) => t.name === 'Entity')
	const propertyType = types.find((t) => t.name === 'Property')

	// Derive entities from current page
	const aliveEntities = useMemo(() => entities?.entities ?? [], [entities])
	const total = entities?.total ?? 0

	// Read search query from URL for client-side filtering
	const searchQuery = searchParams.get('q') ?? ''

	// Client-side filter: when q param or virtual 'entities' type filter is present
	const filteredEntities = useMemo(() => {
		let result = aliveEntities

		// Search filter
		if (searchQuery) {
			const q = searchQuery.toLowerCase()
			result = result.filter((entity) => {
				const name = (entity.propertiesText ?? '').toLowerCase()
				const id = entity.id.toLowerCase()
				return name.includes(q) || id.includes(q)
			})
		}

		return result
	}, [aliveEntities, searchQuery, typeFilter])

	// Active filter chip: 'all', 'entities' (virtual), or an actual type ID
	const activeFilter: FilterType = (() => {
		if (!typeFilter) return 'all'
		if (typeFilter === 'entities') return 'entities'
		if (propertyType && typeFilter === propertyType.id) return propertyType.id
		return typeFilter
	})()

	// Derive type label for EntityTable based on active filter context
	const typeLabel = useMemo(() => {
		if (!typeFilter) return 'Entity'
		if (typeFilter === 'entities') return 'Entity'
		if (propertyType && typeFilter === propertyType.id) return 'Property'
		if (entityType && typeFilter === entityType.id) return 'Entity'
		// Look up type name from types list
		const matchedType = types.find((t) => t.id === typeFilter)
		return matchedType?.name ?? 'Entity'
	}, [typeFilter, entityType, propertyType, types])

	// Clear selection on page change
	const prevOffsetRef = useRef(offset)
	if (prevOffsetRef.current !== offset) {
		prevOffsetRef.current = offset
		setSelectedIds(new Set())
		lastClickedIndexRef.current = null
	}

	// Selection handlers
	const handleToggleSelection = useCallback(
		(id: string, shiftKey: boolean, index: number) => {
			const lastClickedIndex = lastClickedIndexRef.current

			setSelectedIds((prev) => {
				const next = new Set(prev)

				if (shiftKey && lastClickedIndex !== null) {
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
					if (next.has(id)) {
						next.delete(id)
					} else {
						next.add(id)
					}
				}

				return next
			})

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
		q?: string
	}) => {
		const newParams = new URLSearchParams(searchParams)

		if (updates.type !== undefined) {
			if (updates.type === null || updates.type === '' || updates.type === 'all') {
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

		if (updates.q !== undefined) {
			if (updates.q === '') {
				newParams.delete('q')
			} else {
				newParams.set('q', updates.q)
			}
		}

		setSearchParams(newParams, { replace: true })
	}

	const handleFilterTypeChange = (newType: FilterType) => {
		updateParams({
			type: newType === 'all' ? null : newType,
			offset: 0,
		})
	}

	const handlePageChange = (newOffset: number) => {
		updateParams({ offset: newOffset })
	}

	const handleSortChange = (newSort: SortColumn, newOrder: SortOrder) => {
		updateParams({ sort: newSort, order: newOrder, offset: 0 })
	}

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

	const shownCount = filteredEntities.length

	return (
		<div className="p-[18px_20px_24px] max-w-[1600px] mx-auto">
			{/* Toolbar */}
			<div className="flex items-end gap-3.5 mb-3.5">
				<div>
					<h1 className="text-[24px] font-semibold tracking-[-0.5px] leading-[1.1]">Entities</h1>
					<div data-testid="entities-subtitle" className="text-xs text-muted-foreground mt-1">
						<span className="font-mono text-[#3f3f46]">{shownCount.toLocaleString()}</span> shown ·{' '}
						<span className="font-mono">{total.toLocaleString()}</span> total
					</div>
				</div>
				<div className="flex-1" />
				<div className="flex items-center gap-2">
					{selectedIds.size > 0 && (
						<>
							<div data-testid="bulk-action-bar" className="text-xs text-[#3f3f46] px-1">
								<span className="font-mono font-medium">{selectedIds.size}</span> selected
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setBatchDeleteOpen(true)}
								data-testid="batch-delete-button"
								className="text-xs"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 14 14"
									className="mr-1.5"
									aria-hidden="true"
								>
									<title>Delete</title>
									<path
										d="M3 4h8M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6 7v3M8 7v3M4 4l.5 7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L10 4"
										stroke="currentColor"
										strokeWidth="1.2"
										fill="none"
										strokeLinecap="round"
									/>
								</svg>
								Delete
							</Button>
							<Button variant="outline" size="sm" className="text-xs">
								<svg
									width="12"
									height="12"
									viewBox="0 0 14 14"
									className="mr-1.5"
									aria-hidden="true"
								>
									<title>Export</title>
									<path
										d="M7 1v6M4 4l3-3 3 3M2 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"
										stroke="currentColor"
										strokeWidth="1.2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								Export
							</Button>
							<div className="w-px h-5 bg-border mx-0.5" />
						</>
					)}
					<Button
						size="sm"
						onClick={() => navigate('/entities/new')}
						data-testid="create-entity-button"
						className="bg-foreground text-primary-foreground hover:bg-foreground/90 text-xs"
					>
						<svg width="12" height="12" viewBox="0 0 14 14" className="mr-1.5" aria-hidden="true">
							<title>Create</title>
							<path
								d="M7 2v10M2 7h10"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
							/>
						</svg>
						Create entity
					</Button>
				</div>
			</div>

			{/* Filter bar */}
			<div className="flex items-center gap-2 mb-2.5 p-2 bg-card border border-border rounded-lg">
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					className="text-muted-foreground shrink-0"
					aria-hidden="true"
				>
					<circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2" />
					<path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
				</svg>
				<input
					value={query}
					onChange={(e) => {
						setQuery(e.target.value)
						updateParams({ q: e.target.value })
					}}
					placeholder="Search by name, ID, or property…"
					className="flex-1 border-none outline-none bg-transparent text-sm text-foreground"
				/>
				<Chip active={activeFilter === 'all'} onClick={() => handleFilterTypeChange('all')}>
					All <span className="text-[#a1a1aa] ml-1 font-mono">{total.toLocaleString()}</span>
				</Chip>
				<Chip
					active={activeFilter === 'entities'}
					onClick={() => handleFilterTypeChange('entities')}
				>
					Entities
				</Chip>
				<Chip
					active={activeFilter === (propertyType?.id ?? '')}
					onClick={() => handleFilterTypeChange(propertyType?.id ?? '')}
				>
					Properties
				</Chip>
				<div className="w-px h-4 bg-border" />
				<button
					type="button"
					className="border border-dashed border-border bg-transparent text-muted-foreground px-2 py-[3px] rounded-md text-xs cursor-pointer font-inherit flex items-center gap-1"
				>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" />
					</svg>
					Filter
				</button>
			</div>

			{/* Error state */}
			{isError && (
				<div className="bg-red-50 ring-1 ring-red-200 rounded-lg py-4 px-4">
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
				</div>
			)}

			{/* Loading state */}
			{isLoading && !isError && (
				<div className="py-8 space-y-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			)}

			{/* Entity table */}
			{!isLoading && !isError && entities && (
				<EntityTable
					entities={filteredEntities}
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
					activeTypeFilter={typeLabel}
				/>
			)}

			{/* Batch Delete Dialog */}
			<BatchDeleteDialog
				selectedIds={selectedIds}
				open={batchDeleteOpen}
				onOpenChange={setBatchDeleteOpen}
				onSuccess={handleBatchDeleteSuccess}
			/>
		</div>
	)
}
