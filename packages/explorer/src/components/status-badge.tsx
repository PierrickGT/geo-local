/**
 * Status Badge Component
 * Displays edit status with appropriate styling using shadcn Badge
 * - pending: warning (amber)
 * - processing: info (blue)
 * - applied: success (green)
 * - failed: destructive (red)
 */

import type { EditStatus } from '~/api/types'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

export interface StatusBadgeProps {
	status: EditStatus
	className?: string
}

const statusConfig: Record<
	EditStatus,
	{ label: string; variant: 'warning' | 'info' | 'success' | 'destructive' }
> = {
	pending: { label: 'Pending', variant: 'warning' },
	processing: { label: 'Processing', variant: 'info' },
	applied: { label: 'Applied', variant: 'success' },
	failed: { label: 'Failed', variant: 'destructive' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status]

	return (
		<Badge variant={config.variant} className={cn('rounded-full', className)}>
			{config.label}
		</Badge>
	)
}
