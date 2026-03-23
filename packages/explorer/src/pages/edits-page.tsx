import { useSearchParams } from 'react-router'
import type { Edit, EditStatus } from '~/api/types'
import { StatusBadge } from '~/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { TruncateId } from '~/components/ui/truncate-id'
import { useEdits } from '~/hooks/use-edits'

const STATUS_OPTIONS: EditStatus[] = ['pending', 'processing', 'applied', 'failed']

/**
 * Edits page with status filter and edit list.
 * - Status filter syncs to URL ?status=
 * - List shows id, spaceId, author, name, status, opCount, timestamps
 * - Handles loading, empty, and error states
 */
export function EditsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	// Get status filter from URL
	const statusFilter = (searchParams.get('status') as EditStatus | null) ?? undefined

	// Fetch edits with current filter
	const { edits, isLoading, isError, error, refetch } = useEdits({
		status: statusFilter,
	})

	// Update URL params
	const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newStatus = event.target.value
		const newParams = new URLSearchParams(searchParams)

		if (newStatus === '') {
			newParams.delete('status')
		} else {
			newParams.set('status', newStatus)
		}

		setSearchParams(newParams, { replace: true })
	}

	// Handle retry on error
	const handleRetry = () => {
		refetch()
	}

	// Format timestamp for display
	const formatTimestamp = (timestamp: string | null): string => {
		if (!timestamp) return '-'
		return new Date(timestamp).toLocaleString()
	}

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Edits</CardTitle>
					<div className="flex items-center gap-2">
						<label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
							Filter by status:
						</label>
						<select
							id="status-filter"
							value={statusFilter ?? ''}
							onChange={handleStatusChange}
							className="block w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">All statuses</option>
							{STATUS_OPTIONS.map((status) => (
								<option key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</option>
							))}
						</select>
					</div>
				</CardHeader>
			</Card>

			{/* Error state */}
			{isError && (
				<Card className="bg-red-50 ring-red-200">
					<CardContent className="py-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-medium text-red-800">Failed to load edits</h3>
								<p className="text-sm text-red-600 mt-1">
									{error?.message || 'An unexpected error occurred'}
								</p>
							</div>
							<button
								type="button"
								onClick={handleRetry}
								className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
							>
								Retry
							</button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Loading state */}
			{isLoading && !isError && (
				<Card>
					<CardContent className="py-8">
						<div className="space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					</CardContent>
				</Card>
			)}

			{/* Empty state */}
			{!isLoading && !isError && edits && edits.edits.length === 0 && (
				<Card>
					<CardContent className="py-6">
						<p className="text-gray-500">
							{statusFilter ? `No ${statusFilter} edits found.` : 'No edits found.'}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Edits table */}
			{!isLoading && !isError && edits && edits.edits.length > 0 && (
				<Card>
					<CardContent className="px-0">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											ID
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Space ID
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Author
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Name
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Status
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Ops
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Created
										</th>
										<th
											scope="col"
											className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Applied
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{edits.edits.map((edit) => (
										<EditRow key={edit.id} edit={edit} formatTimestamp={formatTimestamp} />
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

/**
 * Edit row component
 */
interface EditRowProps {
	edit: Edit
	formatTimestamp: (timestamp: string | null) => string
}

function EditRow({ edit, formatTimestamp }: EditRowProps) {
	return (
		<tr className="hover:bg-gray-50 transition-colors">
			<td className="px-4 py-4 whitespace-nowrap">
				<TruncateId id={edit.id} />
			</td>
			<td className="px-4 py-4 whitespace-nowrap">
				<TruncateId id={edit.spaceId} />
			</td>
			<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{edit.author}</td>
			<td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{edit.name}</td>
			<td className="px-4 py-4 whitespace-nowrap">
				<StatusBadge status={edit.status} />
			</td>
			<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{edit.opCount}</td>
			<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
				{formatTimestamp(edit.createdAt)}
			</td>
			<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
				{formatTimestamp(edit.appliedAt)}
			</td>
		</tr>
	)
}
