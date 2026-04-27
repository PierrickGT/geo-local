import type * as React from 'react'

import { cn } from '~/lib/utils'

type SortDirection = 'asc' | 'desc' | 'none'

const nextDirection: Record<SortDirection, SortDirection> = {
	none: 'asc',
	asc: 'desc',
	desc: 'none',
}

function SortArrow({
	direction,
	onDirectionChange,
	className,
	...props
}: React.ComponentProps<'button'> & {
	direction: SortDirection
	onDirectionChange: (dir: SortDirection) => void
}) {
	return (
		<button
			type="button"
			data-slot="sort-arrow"
			data-direction={direction}
			className={cn(
				'inline-flex items-center justify-center cursor-pointer transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
				className,
			)}
			onClick={() => onDirectionChange(nextDirection[direction])}
			aria-label={`Sort ${direction}`}
			{...props}
		>
			<svg
				width="9"
				height="9"
				viewBox="0 0 9 9"
				fill="none"
				role="img"
				aria-label={`Sort ${direction}`}
			>
				<path
					d="M4.5 2V7M2.5 3.5L4.5 1.5L6.5 3.5"
					stroke="currentColor"
					strokeWidth="1.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={cn(direction === 'asc' ? 'text-accent' : 'text-muted-foreground/40')}
				/>
				<path
					d="M4.5 7V2M2.5 5.5L4.5 7.5L6.5 5.5"
					stroke="currentColor"
					strokeWidth="1.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={cn(direction === 'desc' ? 'text-accent' : 'text-muted-foreground/40')}
				/>
			</svg>
		</button>
	)
}

export { SortArrow }
export type { SortDirection }
