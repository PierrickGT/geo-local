import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import type { Entity } from '~/api/types'
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
	selectedIds?: Set<string>
	onToggleSelection?: (id: string, shiftKey: boolean, index: number) => void
	onToggleSelectAll?: () => void
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
 * Paginated table of entities with columns: id, properties, timestamps.
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
	selectedIds,
	onToggleSelection,
	onToggleSelectAll,
}: EntityTableProps) {
	const navigate = useNavigate()
	const hasSelection = selectedIds !== undefined
	const headerCheckboxRef = useRef<HTMLInputElement>(null)

	const selectedCount = hasSelection ? entities.filter((e) => selectedIds.has(e.id)).length : 0

	const setHeaderCheckboxRef = useCallback(
		(node: HTMLInputElement | null) => {
			;(headerCheckboxRef as React.MutableRefObject<HTMLInputElement | null>).current = node
			if (node) {
				node.indeterminate = hasSelection && selectedCount > 0 && selectedCount < entities.length
			}
		},
		[hasSelection, selectedCount, entities.length],
	)

	const handleRowClick = (entityId: string) => {
		navigate(`/entities/${encodeURIComponent(entityId)}`)
	}

	const handleRowKeyDown = (entityId: string, event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			// Don't hijack keyboard events intended for checkbox inputs
			if ((event.target as HTMLElement).tagName === 'INPUT') return
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
							{hasSelection && (
								<th scope="col" className="px-4 py-3 w-10">
									<input
										ref={setHeaderCheckboxRef}
										type="checkbox"
										checked={entities.length > 0 && selectedCount === entities.length}
										onChange={() => onToggleSelectAll?.()}
										aria-label="Select all"
										className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
								</th>
							)}
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
					<tbody
						className="bg-white divide-y divide-gray-200"
						onMouseDown={(e) => {
							if (e.shiftKey) e.preventDefault()
						}}
					>
						{entities.map((entity, index) => (
							<tr
								key={entity.id}
								onClick={() => handleRowClick(entity.id)}
								onKeyDown={(e) => handleRowKeyDown(entity.id, e)}
								tabIndex={0}
								className="hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
							>
								{hasSelection && (
									<td className="px-4 py-4 w-10">
										<input
											type="checkbox"
											checked={selectedIds?.has(entity.id) ?? false}
											onChange={() => {}}
											onClick={(e) => {
												e.stopPropagation()
												onToggleSelection?.(entity.id, e.shiftKey, index)
											}}
											aria-label={`Select ${entity.id}`}
											className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
									</td>
								)}
								<td className="px-6 py-4 whitespace-nowrap">
									<TruncateId id={entity.id} />
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
									{entity.propertiesText ?? '-'}
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
