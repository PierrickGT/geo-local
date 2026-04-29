import type * as React from 'react'

import { cn } from '~/lib/utils'

function Kbd({ className, children, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot="kbd"
			className={cn(
				'inline-flex items-center justify-center font-mono text-xs leading-none px-1.5 py-0.5 border border-border rounded bg-background text-muted-foreground',
				className,
			)}
			{...props}
		>
			{children}
		</span>
	)
}

export { Kbd }
