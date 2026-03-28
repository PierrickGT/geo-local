import { useNavigate, useSearchParams } from 'react-router'
import type { Entity, SearchResult } from '~/api/types'
import { SearchInput } from '~/components/search-input'
import { Button } from '~/components/ui/button'
import { TruncateId } from '~/components/ui/truncate-id'
import { useSearch } from '~/hooks/use-search'

/**
 * Search page with debounced input, URL sync, and results list.
 * - Query syncs to URL ?q=
 * - Prepopulated on load from URL
 * - Empty query suppresses search
 * - Results show entity ID matches and text triple matches
 * - Clicking result navigates to entity detail
 */
export function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()

	// Get query from URL
	const query = searchParams.get('q') ?? ''

	// Debounced search via hook
	const { results, isLoading, isDebouncing, isError, error, refetch } = useSearch({
		q: query,
		debounceMs: 300,
	})

	// Update URL when query changes
	const handleQueryChange = (newQuery: string) => {
		const newParams = new URLSearchParams(searchParams)
		if (newQuery.trim()) {
			newParams.set('q', newQuery)
		} else {
			newParams.delete('q')
		}
		setSearchParams(newParams, { replace: true })
	}

	// Navigate to entity detail
	const handleResultClick = (result: SearchResult) => {
		navigate(`/entities/${encodeURIComponent(result.entityId)}`)
	}

	const handleEntityClick = (entity: Entity) => {
		navigate(`/entities/${encodeURIComponent(entity.id)}`)
	}

	// Handle keyboard navigation on result rows
	const handleResultKeyDown = (result: SearchResult, event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			handleResultClick(result)
		}
	}

	const handleEntityKeyDown = (entity: Entity, event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			handleEntityClick(entity)
		}
	}

	// Determine current state
	const isEmptyQuery = !query.trim()
	const isSearching = isLoading || isDebouncing
	const entityResults = results?.entities ?? []
	const textResults = results?.results ?? []
	const hasAnyResults = entityResults.length > 0 || textResults.length > 0
	const hasNoResults = results && !hasAnyResults

	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold text-gray-900 mb-6">Search</h1>

			{/* Search input */}
			<div className="mb-6">
				<SearchInput value={query} onChange={handleQueryChange} className="max-w-md" />
			</div>

			{/* Error state */}
			{isError && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-red-800">Search failed</h3>
							<p className="text-sm text-red-600 mt-1">
								{error?.message || 'An unexpected error occurred'}
							</p>
						</div>
						<Button variant="destructive" size="sm" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				</div>
			)}

			{/* Loading state */}
			{isSearching && !isError && (
				<div className="bg-white rounded-lg border border-gray-200 p-8">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
						<span className="ml-3 text-gray-500">Searching...</span>
					</div>
				</div>
			)}

			{/* Empty query state */}
			{isEmptyQuery && !isSearching && !isError && (
				<div className="bg-white rounded-lg border border-gray-200 p-6">
					<p className="text-gray-500">Enter a search query to find entities by name or ID.</p>
				</div>
			)}

			{/* No results state */}
			{hasNoResults && !isSearching && !isError && (
				<div className="bg-white rounded-lg border border-gray-200 p-6">
					<p className="text-gray-500">No results found for "{query}".</p>
				</div>
			)}

			{/* Entity ID matches */}
			{entityResults.length > 0 && !isSearching && !isError && (
				<div className="mb-4">
					<h2 className="text-sm font-medium text-gray-500 mb-2">
						Matching entities ({entityResults.length})
					</h2>
					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Entity ID
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Name
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{entityResults.map((entity) => (
									<tr
										key={entity.id}
										onClick={() => handleEntityClick(entity)}
										onKeyDown={(e) => handleEntityKeyDown(entity, e)}
										tabIndex={0}
										className="hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<TruncateId id={entity.id} />
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{entity.propertiesText ?? <span className="text-gray-400 italic">No name</span>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Text results */}
			{textResults.length > 0 && !isSearching && !isError && (
				<div>
					<h2 className="text-sm font-medium text-gray-500 mb-2">
						Text matches ({textResults.length})
					</h2>
					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Entity ID
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Property ID
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Value
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{textResults.map((result, index) => (
									<tr
										key={`${result.entityId}-${result.propertyId}-${index}`}
										onClick={() => handleResultClick(result)}
										onKeyDown={(e) => handleResultKeyDown(result, e)}
										tabIndex={0}
										className="hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<TruncateId id={result.entityId} />
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<span className="font-mono">{result.propertyId.slice(0, 12)}...</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{formatValue(result.value)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	)
}

/**
 * Format a StoredValue for display.
 */
function formatValue(value: { value: unknown }): string {
	const v = value.value
	if (typeof v === 'string') {
		return v.length > 100 ? `${v.slice(0, 100)}...` : v
	}
	if (typeof v === 'number' || typeof v === 'boolean') {
		return String(v)
	}
	return JSON.stringify(v)
}
