import type * as React from 'react'

import { cn } from '~/lib/utils'

function Chip({
	active = false,
	className,
	children,
	...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
	return (
		<button
			type="button"
			data-slot="chip"
			data-active={active}
			className={cn(
				'inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs rounded-md cursor-pointer transition-colors font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
				active
					? 'bg-foreground text-primary-foreground border border-foreground'
					: 'bg-card text-foreground border border-border hover:bg-muted',
				className,
			)}
			{...props}
		>
			{children}
		</button>
	)
}

export { Chip }
