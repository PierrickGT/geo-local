import type * as React from 'react'

import { cn } from '~/lib/utils'

type Tab = {
	id: string
	label: string
}

function TabBar({
	tabs,
	activeTab,
	onTabChange,
	className,
	...props
}: React.ComponentProps<'div'> & {
	tabs: readonly Tab[]
	activeTab: string
	onTabChange: (id: string) => void
}) {
	return (
		<div
			data-slot="tab-bar"
			className={cn('flex border-b border-border px-3 gap-1', className)}
			{...props}
		>
			{tabs.map((tab) => {
				const isActive = tab.id === activeTab
				return (
					<button
						key={tab.id}
						type="button"
						data-active={isActive}
						className={cn(
							'px-3 py-2.5 text-sm cursor-pointer transition-colors -mb-px',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							isActive
								? 'text-foreground font-medium border-b-2 border-accent'
								: 'text-muted-foreground font-normal border-b-2 border-transparent hover:text-foreground',
						)}
						onClick={() => onTabChange(tab.id)}
					>
						{tab.label}
					</button>
				)
			})}
		</div>
	)
}

export { TabBar }
export type { Tab }
