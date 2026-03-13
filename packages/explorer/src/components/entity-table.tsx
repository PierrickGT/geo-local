import { useNavigate } from 'react-router'
import type { Entity, EntityStatus } from '~/api/types'
import { Pagination } from '~/components/pagination'
import { TruncateId } from '~/components/ui/truncate-id'

interface EntityTableProps {
	entities: Entity[]
	total: number
	limit: number
	offset: number
	onPageChange: (newOffset: number) => void
	isLoading?: boolean
	className?: string
}

/**
 * Status badge component for displaying entity status.
 */
function StatusBadge({ status }: { status: EntityStatus }) {
	const isAlive = status === 'alive'

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
				isAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
			}`}
		>
			{status}
		</span>
	)
}

/**
 * Formats an ISO date string to a human-readable format.
 */
function formatDate(isoString: string): string {
	const date = new Date(isoString)
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * Paginated table of entities with columns: id, status, timestamps.
 * Rows are clickable and navigate to entity detail page.
 */
export function EntityTable({
	entities,
	total,
	limit,
	offset,
	onPageChange,
	isLoading = false,
	className = '',
}: EntityTableProps) {
	const navigate = useNavigate()

	const handleRowClick = (entityId: string) => {
		navigate(`/entities/${encodeURIComponent(entityId)}`)
	}

	const handleRowKeyDown = (entityId: string, event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			handleRowClick(entityId)
		}
	}

	if (isLoading) {
		return (
			<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
				<div className="p-8 text-center text-gray-500">Loading entities...</div>
			</div>
		)
	}

	if (entities.length === 0) {
		return (
			<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
				<div className="p-8 text-center text-gray-500">No entities found.</div>
			</div>
		)
	}

	return (
		<div className={className}>
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								ID
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Properties
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Status
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Created
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Updated
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{entities.map((entity) => (
							<tr
								key={entity.id}
								onClick={() => handleRowClick(entity.id)}
								onKeyDown={(e) => handleRowKeyDown(entity.id, e)}
								tabIndex={0}
								className="hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<TruncateId id={entity.id} />
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
									{entity.propertiesText ?? '-'}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<StatusBadge status={entity.status} />
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(entity.createdAt)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(entity.updatedAt)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="mt-4">
				<Pagination total={total} limit={limit} offset={offset} onPageChange={onPageChange} />
			</div>
		</div>
	)
}
