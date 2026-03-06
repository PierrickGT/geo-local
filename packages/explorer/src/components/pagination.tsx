interface PaginationProps {
	total: number
	limit: number
	offset: number
	onPageChange: (newOffset: number) => void
	className?: string
}

/**
 * Pagination controls with first/prev/next/last buttons.
 * Shows current page range and total count.
 * Disables buttons appropriately at boundaries.
 */
export function Pagination({
	total,
	limit,
	offset,
	onPageChange,
	className = '',
}: PaginationProps) {
	const currentPage = Math.floor(offset / limit) + 1
	const totalPages = Math.ceil(total / limit)
	const startItem = total === 0 ? 0 : offset + 1
	const endItem = Math.min(offset + limit, total)

	const isFirstPage = offset === 0
	const isLastPage = offset + limit >= total

	const goToFirst = () => onPageChange(0)
	const goToPrev = () => onPageChange(Math.max(0, offset - limit))
	const goToNext = () => onPageChange(offset + limit)
	const goToLast = () => onPageChange(Math.max(0, (totalPages - 1) * limit))

	if (total === 0) {
		return null
	}

	return (
		<div className={`flex items-center justify-between ${className}`}>
			<span className="text-sm text-gray-700">
				Showing <span className="font-medium">{startItem}</span> to{' '}
				<span className="font-medium">{endItem}</span> of{' '}
				<span className="font-medium">{total}</span> results
			</span>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={goToFirst}
					disabled={isFirstPage}
					className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
					title="First page"
				>
					First
				</button>

				<button
					type="button"
					onClick={goToPrev}
					disabled={isFirstPage}
					className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
					title="Previous page"
				>
					Prev
				</button>

				<span className="px-3 py-1.5 text-sm text-gray-700">
					Page <span className="font-medium">{currentPage}</span> of{' '}
					<span className="font-medium">{totalPages}</span>
				</span>

				<button
					type="button"
					onClick={goToNext}
					disabled={isLastPage}
					className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
					title="Next page"
				>
					Next
				</button>

				<button
					type="button"
					onClick={goToLast}
					disabled={isLastPage}
					className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
					title="Last page"
				>
					Last
				</button>
			</div>
		</div>
	)
}
