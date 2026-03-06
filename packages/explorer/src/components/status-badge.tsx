/**
 * Status Badge Component
 * Displays edit status with appropriate styling
 * - pending: yellow/amber
 * - processing: blue
 * - applied: green
 * - failed: red
 */

import type { EditStatus } from '~/api/types'

export interface StatusBadgeProps {
	status: EditStatus
	className?: string
}

const statusConfig: Record<EditStatus, { label: string; className: string }> = {
	pending: {
		label: 'Pending',
		className: 'bg-amber-100 text-amber-800 border-amber-200',
	},
	processing: {
		label: 'Processing',
		className: 'bg-blue-100 text-blue-800 border-blue-200',
	},
	applied: {
		label: 'Applied',
		className: 'bg-green-100 text-green-800 border-green-200',
	},
	failed: {
		label: 'Failed',
		className: 'bg-red-100 text-red-800 border-red-200',
	},
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
	const config = statusConfig[status]

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
		>
			{config.label}
		</span>
	)
}
