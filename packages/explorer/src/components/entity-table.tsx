import { useNavigate } from 'react-router'
import type { Entity } from '~/api/types'
import { Pagination } from '~/components/pagination'
import { CopyIdButton } from '~/components/ui/copy-id-button'
import { SortArrow } from '~/components/ui/sort-arrow'

type SortColumn = 'updated_at' | 'created_at' | 'properties_text'
type SortOrder = 'asc' | 'desc'

interface EntityTableProps {
	entities: Entity[]
	total: number
	limit: number
	offset: number
	onPageChange: (newOffset: number) => void
	currentSort?: SortColumn
	currentOrder?: SortOrder
	onSortChange?: (sort: SortColumn, order: SortOrder) => void
	isLoading?: boolean
	className?: string
	selectedIds?: Set<string>
	onToggleSelection?: (id: string, shiftKey: boolean, index: number) => void
	onToggleSelectAll?: () => void
}

function formatRelativeTime(isoString: string): string {
	const now = new Date()
	const date = new Date(isoString)
	const diffMs = now.getTime() - date.getTime()
	const diffSec = Math.floor(diffMs / 1000)
	const diffMin = Math.floor(diffSec / 60)
	const diffHr = Math.floor(diffMin / 60)
	const diffDay = Math.floor(diffHr / 24)

	if (diffSec < 60) return 'just now'
	if (diffMin < 60) return `${diffMin}m ago`
	if (diffHr < 24) return `${diffHr}h ago`
	if (diffDay < 30) return `${diffDay}d ago`

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
}

/**
 * 6-column grid entity table with Graphite design:
 * checkbox(36px) / Name(dot) / ID(mono,copy) / Type(pill) / Updated(mono,tabular-nums) / chevron
 */
export function EntityTable({
	entities,
	total,
	limit,
	offset,
	onPageChange,
	currentSort = 'updated_at',
	currentOrder = 'desc',
	onSortChange,
	isLoading = false,
	className = '',
	selectedIds,
	onToggleSelection,
	onToggleSelectAll,
}: EntityTableProps) {
	const navigate = useNavigate()
	const hasSelection = selectedIds !== undefined

	const selectedCount = hasSelection ? entities.filter((e) => selectedIds.has(e.id)).length : 0

	const getSortDirection = (column: SortColumn): 'asc' | 'desc' | 'none' => {
		if (currentSort !== column) return 'none'
		return currentOrder
	}

	const handleSortDirection = (column: SortColumn, dir: 'asc' | 'desc' | 'none') => {
		if (!onSortChange) return
		if (dir === 'none') {
			onSortChange(column, 'asc')
		} else {
			onSortChange(column, dir)
		}
	}

	if (isLoading) {
		return (
			<div className={`bg-card border border-border rounded-lg ${className}`}>
				<div className="p-8 text-center text-muted-foreground">Loading entities...</div>
			</div>
		)
	}

	if (entities.length === 0) {
		return (
			<div className={`bg-card border border-border rounded-lg ${className}`}>
				<div className="p-8 text-center text-muted-foreground">No entities found.</div>
			</div>
		)
	}

	return (
		<div className={className}>
			<div className="bg-card border border-border rounded-lg overflow-hidden">
				{/* Header row */}
				<div
					className="grid items-center px-3 py-2 border-b border-border bg-[#fcfcfb]"
					style={{
						gridTemplateColumns: '36px 1fr 340px 150px 150px 60px',
						fontSize: 11,
						color: '#71717a',
						textTransform: 'uppercase',
						letterSpacing: 0.6,
						fontWeight: 600,
					}}
				>
					{/* Checkbox header */}
					<div className="flex items-center justify-center">
						<button
							type="button"
							onClick={() => onToggleSelectAll?.()}
							role="checkbox"
							aria-checked={entities.length > 0 && selectedCount === entities.length}
							aria-label="Select all"
							className="cursor-pointer border-none bg-transparent p-0"
							data-testid="header-checkbox"
							style={{
								width: 14,
								height: 14,
								borderRadius: 3,
								border: selectedCount > 0 ? '1px solid var(--color-accent)' : '1px solid #a1a1aa',
								background: selectedCount > 0 ? 'var(--color-accent)' : 'var(--color-card)',
								display: 'grid',
								placeItems: 'center',
								transition: 'all .12s',
							}}
						>
							{entities.length > 0 && selectedCount === entities.length && (
								<svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
									<title>Checked</title>
									<path
										d="M1.5 4.5l2 2 4-4"
										stroke="#fff"
										strokeWidth="1.5"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							)}
							{hasSelection && selectedCount > 0 && selectedCount < entities.length && (
								<div
									aria-hidden="true"
									style={{
										width: 7,
										height: 1.5,
										background: '#fff',
									}}
								/>
							)}
						</button>
					</div>

					{/* Name */}
					<div className="flex items-center gap-1">
						<span>Name</span>
						<SortArrow
							direction={getSortDirection('properties_text')}
							onDirectionChange={(dir) => handleSortDirection('properties_text', dir)}
							data-testid="sort-arrow"
						/>
					</div>

					{/* ID */}
					<div className="font-mono normal-case tracking-normal" style={{ fontSize: 11.5 }}>
						ID
					</div>

					{/* Type */}
					<div>Type</div>

					{/* Updated */}
					<div className="flex items-center gap-1 text-[#3f3f46]">
						<span>Updated</span>
						<SortArrow
							direction={getSortDirection('updated_at')}
							onDirectionChange={(dir) => handleSortDirection('updated_at', dir)}
							data-testid="sort-arrow"
						/>
					</div>

					<div />
				</div>

				{/* Entity rows */}
				<div
					onMouseDown={(e) => {
						if (e.shiftKey) e.preventDefault()
					}}
				>
					{entities.map((entity, index) => {
						const isSelected = selectedIds?.has(entity.id) ?? false
						const isLast = index === entities.length - 1

						return (
							<div
								key={entity.id}
								data-entity-row={entity.id}
								role="row"
								tabIndex={0}
								className="grid items-center px-3 py-[9px] cursor-pointer transition-colors group"
								style={{
									gridTemplateColumns: '36px 1fr 340px 150px 150px 60px',
									borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)',
									background: isSelected ? 'rgba(238, 242, 255, 0.55)' : 'transparent',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = isSelected
										? 'rgba(238, 242, 255, 0.55)'
										: '#f6f6f5'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = isSelected
										? 'rgba(238, 242, 255, 0.55)'
										: 'transparent'
								}}
								onClick={() => navigate(`/entities/${encodeURIComponent(entity.id)}`)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										if ((e.target as HTMLElement).tagName === 'INPUT') return
										if ((e.target as HTMLElement).tagName === 'BUTTON') return
										e.preventDefault()
										navigate(`/entities/${encodeURIComponent(entity.id)}`)
									}
								}}
							>
								{/* Checkbox */}
								<div className="flex items-center justify-center">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											onToggleSelection?.(entity.id, e.shiftKey, index)
										}}
										role="checkbox"
										aria-checked={isSelected}
										aria-label={`Select ${entity.id}`}
										className="cursor-pointer border-none bg-transparent p-0"
										style={{
											width: 14,
											height: 14,
											borderRadius: 3,
											border: isSelected ? '1px solid var(--color-accent)' : '1px solid #a1a1aa',
											background: isSelected ? 'var(--color-accent)' : 'var(--color-card)',
											display: 'grid',
											placeItems: 'center',
											transition: 'all .12s',
										}}
									>
										{isSelected && (
											<svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
												<title>Checked</title>
												<path
													d="M1.5 4.5l2 2 4-4"
													stroke="#fff"
													strokeWidth="1.5"
													fill="none"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										)}
									</button>
								</div>

								{/* Name with color dot */}
								<div className="flex items-center gap-2 min-w-0">
									<span
										className="shrink-0 rounded-[3px]"
										style={{
											width: 5,
											height: 5,
											background: 'var(--color-accent)',
										}}
									/>
									<span className="font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
										{entity.propertiesText ?? '-'}
									</span>
								</div>

								{/* ID mono + copy */}
								<div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11.5px]">
									<span className="overflow-hidden text-ellipsis whitespace-nowrap">
										{entity.id}
									</span>
									<span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
										<CopyIdButton value={entity.id} data-testid="copy-id-button" />
									</span>
								</div>

								{/* Type pill */}
								<div>
									<span className="inline-flex items-center justify-center text-[11.5px] font-medium px-[7px] py-[2px] rounded-[3px] bg-line-soft text-[#3f3f46]">
										Entity
									</span>
								</div>

								{/* Updated mono + tabular-nums */}
								<div className="text-muted-foreground text-xs font-mono tabular-nums">
									{formatRelativeTime(entity.updatedAt)}
								</div>

								{/* Chevron */}
								<div className="text-right text-[#a1a1aa]" data-testid="row-chevron">
									<svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
										<title>Navigate</title>
										<path
											d="M5 3l3 3.5-3 3.5"
											stroke="currentColor"
											strokeWidth="1.3"
											fill="none"
											strokeLinecap="round"
										/>
									</svg>
								</div>
							</div>
						)
					})}
				</div>

				{/* Footer with pagination */}
				<div
					data-testid="pagination-footer"
					className="flex items-center px-3 py-2 border-t border-border bg-[#fcfcfb] text-xs text-muted-foreground font-mono"
				>
					<Pagination total={total} limit={limit} offset={offset} onPageChange={onPageChange} />
				</div>
			</div>
		</div>
	)
}
