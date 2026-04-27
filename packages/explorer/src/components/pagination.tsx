import { cn } from '~/lib/utils'

interface PaginationProps {
	total: number
	limit: number
	offset: number
	onPageChange: (newOffset: number) => void
	className?: string
}

function PagerBtn({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode
	onClick: () => void
	disabled?: boolean
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'border border-border bg-card px-[7px] py-[2px] rounded text-xs cursor-pointer font-mono text-[#3f3f46]',
				disabled && 'pointer-events-none opacity-50',
			)}
		>
			{children}
		</button>
	)
}

/**
 * Graphite pagination: mono digits, ink-filled current page,
 * navigation preserves filters.
 */
export function Pagination({ total, limit, offset, onPageChange, className }: PaginationProps) {
	const currentPage = Math.floor(offset / limit) + 1
	const totalPages = Math.ceil(total / limit)
	const startItem = total === 0 ? 0 : offset + 1
	const endItem = Math.min(offset + limit, total)

	const isFirstPage = offset === 0
	const isLastPage = offset + limit >= total

	if (total === 0) {
		return null
	}

	// Build page numbers to display
	const pageNumbers: (number | 'ellipsis')[] = []

	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) {
			pageNumbers.push(i)
		}
	} else {
		pageNumbers.push(1)

		if (currentPage > 3) {
			pageNumbers.push('ellipsis')
		}

		const start = Math.max(2, currentPage - 1)
		const end = Math.min(totalPages - 1, currentPage + 1)

		for (let i = start; i <= end; i++) {
			pageNumbers.push(i)
		}

		if (currentPage < totalPages - 2) {
			pageNumbers.push('ellipsis')
		}

		pageNumbers.push(totalPages)
	}

	return (
		<div className={cn('flex items-center gap-1', className)}>
			<span>
				Showing {startItem}–{endItem} of {total.toLocaleString()}
			</span>
			<div className="flex-1" />
			<div className="flex items-center gap-1">
				<PagerBtn onClick={() => onPageChange(Math.max(0, offset - limit))} disabled={isFirstPage}>
					‹
				</PagerBtn>
				{pageNumbers.map((page, idx) =>
					page === 'ellipsis' ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no natural key
						<span key={`ellipsis-${idx}`} className="text-[#a1a1aa] px-1">
							…
						</span>
					) : (
						<button
							key={page}
							type="button"
							onClick={() => onPageChange((page - 1) * limit)}
							className={cn(
								'px-2 py-[2px] rounded text-xs cursor-pointer font-mono',
								page === currentPage
									? 'bg-foreground text-primary-foreground'
									: 'border border-border bg-card text-[#3f3f46]',
							)}
						>
							{page}
						</button>
					),
				)}
				<PagerBtn onClick={() => onPageChange(offset + limit)} disabled={isLastPage}>
					›
				</PagerBtn>
			</div>
		</div>
	)
}
