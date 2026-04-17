import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Pagination as ShadcnPagination,
} from '~/components/ui/pagination'
import { cn } from '~/lib/utils'

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
export function Pagination({ total, limit, offset, onPageChange, className }: PaginationProps) {
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
		<div className={cn('flex items-center justify-between', className)}>
			<span className="text-sm text-muted-foreground">
				Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
				<span className="font-medium text-foreground">{endItem}</span> of{' '}
				<span className="font-medium text-foreground">{total}</span> results
			</span>

			<ShadcnPagination className="mx-0 w-auto justify-end">
				<PaginationContent>
					<PaginationItem>
						<PaginationLink
							onClick={goToFirst}
							aria-label="Go to first page"
							className={cn('cursor-pointer', isFirstPage && 'pointer-events-none opacity-50')}
						>
							<ChevronsLeft className="size-4" />
						</PaginationLink>
					</PaginationItem>

					<PaginationItem>
						<PaginationPrevious
							onClick={goToPrev}
							className={cn('cursor-pointer', isFirstPage && 'pointer-events-none opacity-50')}
						/>
					</PaginationItem>

					<PaginationItem>
						<span className="px-3 py-2 text-sm text-muted-foreground">
							Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
							<span className="font-medium text-foreground">{totalPages}</span>
						</span>
					</PaginationItem>

					<PaginationItem>
						<PaginationNext
							onClick={goToNext}
							className={cn('cursor-pointer', isLastPage && 'pointer-events-none opacity-50')}
						/>
					</PaginationItem>

					<PaginationItem>
						<PaginationLink
							onClick={goToLast}
							aria-label="Go to last page"
							className={cn('cursor-pointer', isLastPage && 'pointer-events-none opacity-50')}
						>
							<ChevronsRight className="size-4" />
						</PaginationLink>
					</PaginationItem>
				</PaginationContent>
			</ShadcnPagination>
		</div>
	)
}
