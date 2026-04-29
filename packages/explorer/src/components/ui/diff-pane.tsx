import type * as React from 'react'

import { cn } from '~/lib/utils'

function DiffPane({
	before,
	after,
	className,
	...props
}: React.ComponentProps<'div'> & {
	before: string
	after: string
}) {
	const isUnchanged = before === after

	return (
		<div data-slot="diff-pane" className={cn('grid grid-cols-2 gap-2', className)} {...props}>
			<div
				data-slot="diff-before"
				className={cn(
					'rounded-md p-3 text-xs font-mono',
					isUnchanged
						? 'bg-muted text-muted-foreground'
						: 'bg-destructive/5 text-destructive border border-destructive/20',
				)}
			>
				<div className="text-xs uppercase tracking-wide font-medium mb-1.5 text-muted-foreground">
					Before
				</div>
				<div className="whitespace-pre-wrap break-all">{before}</div>
			</div>
			<div
				data-slot="diff-after"
				className={cn(
					'rounded-md p-3 text-xs font-mono',
					isUnchanged
						? 'bg-muted text-muted-foreground'
						: 'bg-success/5 text-success border border-success/20',
				)}
			>
				<div className="text-xs uppercase tracking-wide font-medium mb-1.5 text-muted-foreground">
					After
				</div>
				<div className="whitespace-pre-wrap break-all">{after}</div>
			</div>
		</div>
	)
}

export { DiffPane }
