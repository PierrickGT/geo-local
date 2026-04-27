import type * as React from 'react'

import { cn } from '~/lib/utils'

function formatRelativeTime(date: Date): string {
	const now = Date.now()
	const diff = now - date.getTime()
	const seconds = Math.floor(diff / 1000)

	if (seconds < 5) return 'just now'
	if (seconds < 60) return `${seconds}s ago`
	const minutes = Math.floor(seconds / 60)
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

function SyncIndicator({
	lastSync,
	className,
	...props
}: React.ComponentProps<'div'> & { lastSync: Date }) {
	return (
		<div
			data-slot="sync-indicator"
			className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}
			{...props}
		>
			<span
				data-testid="sync-dot"
				className="inline-block w-1.5 h-1.5 rounded-full bg-success"
				style={{ boxShadow: '0 0 0 3px rgba(14, 163, 74, 0.13)' }}
			/>
			<span className="font-mono">synced · {formatRelativeTime(lastSync)}</span>
		</div>
	)
}

export { SyncIndicator }
