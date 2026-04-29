import type * as React from 'react'

import { cn } from '~/lib/utils'

type TypeKind = 'Entity' | 'Property' | 'Type' | string

const kindStyles: Record<string, string> = {
	Entity: 'bg-accent/10 text-accent',
	Property: 'bg-warning/10 text-warning-foreground',
	Type: 'bg-purple/10 text-purple',
}

function TypePill({
	kind,
	className,
	...props
}: React.ComponentProps<'span'> & { kind: TypeKind }) {
	const style = kindStyles[kind] ?? 'bg-muted text-muted-foreground'

	return (
		<span
			data-slot="type-pill"
			data-kind={kindStyles[kind] ? kind : 'unknown'}
			className={cn(
				'inline-flex items-center justify-center text-xs font-medium px-2 py-0.5 rounded-full',
				style,
				className,
			)}
			{...props}
		>
			{kind}
		</span>
	)
}

export { TypePill }
export type { TypeKind }
