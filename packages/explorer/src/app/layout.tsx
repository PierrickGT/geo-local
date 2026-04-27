import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Outlet, NavLink as RouterNavLink, useLocation, useParams } from 'react-router'
import { Kbd } from '~/components/ui/kbd'
import { SyncIndicator } from '~/components/ui/sync-indicator'
import { editKeys } from '~/hooks/use-edits'
import { entityKeys } from '~/hooks/use-entities'

// ---------------------------------------------------------------------------
// SVG icon components for nav items
// ---------------------------------------------------------------------------

function EntitiesIcon({ className }: { className?: string }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			className={className}
			role="img"
			aria-label="Entities"
		>
			<path d="M2 3h10v2H2zM2 7h10v2H2zM2 11h10v2H2z" fill="currentColor" />
		</svg>
	)
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			className={className}
			role="img"
			aria-label="Search"
		>
			<circle cx="6" cy="6" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.3" />
			<path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	)
}

function GraphIcon({ className }: { className?: string }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			className={className}
			role="img"
			aria-label="Graph"
		>
			<circle cx="4" cy="4" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.3" />
			<circle cx="11" cy="11" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.3" />
			<path d="M5.2 5.2l4.7 4.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	)
}

function EditsIcon({ className }: { className?: string }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			className={className}
			role="img"
			aria-label="Edits"
		>
			<path
				d="M2 12h10M9 3l2 2-6 6H3V9z"
				stroke="currentColor"
				fill="none"
				strokeWidth="1.3"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

// ---------------------------------------------------------------------------
// Logo SVG
// ---------------------------------------------------------------------------

function LogoIcon() {
	return (
		<div className="w-[22px] h-[22px] rounded-[5px] bg-foreground grid place-items-center">
			<svg width="12" height="12" viewBox="0 0 12 12" role="img" aria-label="Lattice logo">
				<path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2zM7 7h3v3H7z" fill="#fff" opacity=".85" />
				<path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="#fff" strokeWidth=".8" />
			</svg>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Nav items config
// ---------------------------------------------------------------------------

const navItems = [
	{
		to: '/entities',
		label: 'Entities',
		id: 'nav-entities',
		countKey: 'entities' as const,
		icon: EntitiesIcon,
	},
	{
		to: '/search',
		label: 'Search',
		id: 'nav-search',
		countKey: null,
		icon: SearchIcon,
	},
	{
		to: '/graph',
		label: 'Graph',
		id: 'nav-graph',
		countKey: 'entities' as const,
		icon: GraphIcon,
	},
	{
		to: '/edits',
		label: 'Edits',
		id: 'nav-edits',
		countKey: 'edits' as const,
		icon: EditsIcon,
	},
] as const

const savedViews = ['Properties only', 'Recent edits', 'Labs ≥ 5']

// ---------------------------------------------------------------------------
// Breadcrumb helpers
// ---------------------------------------------------------------------------

function getBreadcrumbSegments(pathname: string, _entityId?: string): string[] {
	if (pathname === '/entities') return ['Entities']
	if (pathname === '/search') return ['Search']
	if (pathname === '/graph') return ['Graph']
	if (pathname === '/edits') return ['Edits']
	if (pathname === '/entities/new') return ['Entities', 'New entity']
	if (pathname.match(/^\/entities\/[^/]+\/edit$/)) return ['Entities', 'Edit entity']
	if (pathname.match(/^\/entities\/[^/]+$/)) return ['Entities', 'Entity']
	return ['Entities']
}

// ---------------------------------------------------------------------------
// useLastSyncTime — derive from TanStack Query cache
// ---------------------------------------------------------------------------

function useLastSyncTime(): Date {
	const queryClient = useQueryClient()
	const [lastSync, setLastSync] = useState(() => new Date())

	useEffect(() => {
		const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
			if (event?.type === 'updated') {
				setLastSync(new Date())
			}
		})
		return unsubscribe
	}, [queryClient])

	return lastSync
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Layout() {
	const location = useLocation()
	const params = useParams()
	const queryClient = useQueryClient()
	const lastSync = useLastSyncTime()

	const crumbs = getBreadcrumbSegments(location.pathname, params.id)

	// Read entity/edits counts from query cache for sidebar display
	const entityCache = queryClient.getQueryData<{ total: number }>(entityKeys.list({ limit: 1 }))
	const editsCache = queryClient.getQueryData<{ edits: unknown[] }>(editKeys.list())
	const entityCount = entityCache?.total
	const editsCount = editsCache?.edits?.length

	return (
		<div className="h-screen bg-background flex font-sans text-foreground text-[13px] tracking-[-0.01em]">
			{/* Sidebar */}
			<aside
				data-testid="sidebar"
				className="w-[232px] bg-[var(--sidebar)] border-r border-border flex flex-col shrink-0"
			>
				{/* Brand block */}
				<div className="px-4 pt-[18px] pb-4 border-b border-line-soft">
					<div className="flex items-center gap-2">
						<LogoIcon />
						<div>
							<div className="font-semibold text-[13.5px] tracking-[-0.2px]">Lattice</div>
							<div className="text-[11px] text-muted-foreground font-mono">geo · mainnet</div>
						</div>
					</div>
				</div>

				{/* Explore group */}
				<div className="px-2.5 pt-2.5 pb-1">
					<div className="text-[10.5px] text-[var(--color-muted-foreground)]/[0.6] uppercase tracking-[1px] px-2 py-1.5 font-semibold">
						Explore
					</div>
					{navItems.map((item) => {
						const Icon = item.icon
						const count =
							item.countKey === 'entities'
								? entityCount
								: item.countKey === 'edits'
									? editsCount
									: undefined

						return (
							<RouterNavLink
								key={item.to}
								to={item.to}
								data-testid={item.id}
								className={({ isActive }) => {
									const base =
										'w-full flex items-center gap-2.5 px-2 py-[7px] rounded-md border-none cursor-pointer font-inherit text-[13px] text-left no-underline'
									const active = isActive
										? 'bg-hover text-foreground font-medium'
										: 'bg-transparent text-[#3f3f46] font-normal'
									return `${base} ${active}`
								}}
							>
								{({ isActive }) => (
									<>
										<Icon
											className={`shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground'}`}
										/>
										<span className="flex-1">{item.label}</span>
										{count !== undefined && (
											<span className="text-[11px] text-[#a1a1aa] font-mono tabular-nums">
												{count.toLocaleString()}
											</span>
										)}
									</>
								)}
							</RouterNavLink>
						)
					})}
				</div>

				{/* Saved views group */}
				<div className="px-2.5 pt-3.5 pb-1">
					<div className="text-[10.5px] text-[var(--color-muted-foreground)]/[0.6] uppercase tracking-[1px] px-2 py-1.5 font-semibold">
						Saved views
					</div>
					{savedViews.map((view) => (
						<button
							key={view}
							type="button"
							className="w-full flex items-center gap-2.5 px-2 py-1.5 border-none bg-transparent text-[#3f3f46] rounded-md cursor-default font-inherit text-[12.5px] text-left"
						>
							<span className="w-1.5 h-1.5 rounded-[1px] bg-[#a1a1aa]" />
							{view}
						</button>
					))}
				</div>

				<div className="flex-1" />

				{/* Footer */}
				<div className="px-3.5 py-2.5 border-t border-line-soft">
					<span className="text-[11px] text-muted-foreground font-mono">local · 0.1</span>
				</div>
			</aside>

			{/* Main content area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top bar */}
				<div
					data-testid="top-bar"
					className="h-11 border-b border-border bg-white flex items-center px-4 gap-3.5 shrink-0"
				>
					{/* Breadcrumb */}
					<div
						data-testid="breadcrumb"
						className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"
					>
						{crumbs.map((crumb, i) => (
							<span key={crumb} className="contents">
								{i > 0 && <span className="text-[#a1a1aa]">/</span>}
								<span
									className={
										i === crumbs.length - 1
											? 'text-foreground font-medium'
											: 'text-muted-foreground font-normal'
									}
								>
									{crumb}
								</span>
							</span>
						))}
					</div>

					<div className="flex-1" />

					{/* Sync indicator */}
					<SyncIndicator lastSync={lastSync} />

					{/* Separator */}
					<div className="w-px h-[18px] bg-border" />

					{/* Command-K hint */}
					<div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
						<span>Command</span>
						<Kbd>⌘K</Kbd>
					</div>
				</div>

				{/* Page content */}
				<div className="flex-1 overflow-auto bg-background">
					<Outlet />
				</div>
			</div>
		</div>
	)
}
