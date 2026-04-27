import type * as React from 'react'

import { cn } from '~/lib/utils'

function Panel({
	title,
	right,
	children,
	className,
	...props
}: React.ComponentProps<'div'> & {
	title: string
	right?: React.ReactNode
}) {
	return (
		<div
			data-slot="panel"
			className={cn('bg-card border border-border rounded-lg overflow-hidden', className)}
			{...props}
		>
			<div className="flex items-center px-3.5 py-2.5 border-b border-border">
				<div className="text-[12.5px] font-medium text-foreground">{title}</div>
				<div className="flex-1" />
				{right}
			</div>
			{children}
		</div>
	)
}

export { Panel }
