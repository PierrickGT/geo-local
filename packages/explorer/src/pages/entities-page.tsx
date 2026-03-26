import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { EntityTable } from '~/components/entity-table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { useEntities, useTypes } from '~/hooks/use-entities'

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

/**
 * Entities page with type filter dropdown and pagination.
 * URL syncs ?type=, ?limit=, ?offset=
 */
export function EntitiesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

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

	// Fetch entities with current filters
	const { entities, isLoading, isError, error, refetch } = useEntities({
		type: typeFilter,
		limit,
		offset,
	})

	// Fetch available types for dropdown
	const { types, isLoading: isLoadingTypes } = useTypes()

	// Update URL params
	const updateParams = (updates: { type?: string | null; limit?: number; offset?: number }) => {
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
					<Button
						size="sm"
						onClick={() => navigate('/entities/new')}
						data-testid="create-entity-button"
					>
						Create Entity
					</Button>
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
						{types?.map((typeId) => (
							<option key={typeId} value={typeId}>
								{typeId.slice(0, 12)}...
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
					/>
				</CardContent>
			)}
		</Card>
	)
}
