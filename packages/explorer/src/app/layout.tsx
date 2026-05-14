import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, Outlet, NavLink as RouterNavLink, useLocation, useParams } from 'react-router'
import { getEdits } from '~/api/edits'
import { getEntities } from '~/api/entities'
import { Kbd } from '~/components/ui/kbd'
import { SyncIndicator } from '~/components/ui/sync-indicator'
import { entityKeys } from '~/hooks/use-entities'
import { BreadcrumbProvider, useBreadcrumbExtra } from './breadcrumb-context'

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
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" role="img" aria-label="Geo logo">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M14.3558 14.5685C14.5064 14.824 14.4369 15.1543 14.1838 15.3089C12.9706 16.0499 11.5349 16.4784 9.99619 16.4784C8.46312 16.4784 7.0323 16.053 5.82196 15.3171C5.56819 15.1628 5.49827 14.832 5.64911 14.5761L9.51384 8.02041C9.73427 7.6465 10.2751 7.6465 10.4955 8.02041L14.3558 14.5685ZM4.94964 16.9532C4.66671 16.787 4.29709 16.8695 4.13047 17.1522L2.95809 19.1408C2.73416 19.5207 3.00801 20 3.44895 20H16.5604C17.0014 20 17.2752 19.5207 17.0513 19.1408L15.8745 17.1447C15.7077 16.8618 15.3376 16.7795 15.0546 16.9462C13.5791 17.8155 11.8478 18.3159 9.99619 18.3159C8.14957 18.3159 6.4226 17.8182 4.94964 16.9532Z"
				fill="currentColor"
			/>
			<circle
				cx="9.99613"
				cy="8.49619"
				r="7.4278"
				transform="rotate(-180 9.99613 8.49619)"
				stroke="url(#paint0_radial_50332_342693)"
				strokeWidth="2.13675"
			/>
			<defs>
				<radialGradient
					id="paint0_radial_50332_342693"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(9.99613 15.4291) rotate(-90) scale(15.4291 55.084)"
				>
					<stop stopColor="#FF78E6" />
					<stop offset="1" stopColor="#9542FF" />
				</radialGradient>
			</defs>
		</svg>
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

// ---------------------------------------------------------------------------
// Breadcrumb helpers
// ---------------------------------------------------------------------------

function getBreadcrumbSegments(
	pathname: string,
	_entityId?: string,
	extra?: string[] | null,
): string[] {
	if (extra) return extra
	if (pathname === '/entities') return ['Entities']
	if (pathname === '/search') return ['Search']
	if (pathname === '/graph') return ['Graph']
	if (pathname === '/edits') return ['Edits']
	if (pathname === '/entities/new') return ['Entities', 'New']
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
	return (
		<BreadcrumbProvider>
			<LayoutInner />
		</BreadcrumbProvider>
	)
}

function LayoutInner() {
	const location = useLocation()
	const params = useParams()
	const lastSync = useLastSyncTime()
	const extraCrumbs = useBreadcrumbExtra()

	const crumbs = getBreadcrumbSegments(location.pathname, params.id, extraCrumbs)

	// Fetch entity/edits counts for sidebar display via lightweight queries
	const { data: entityData } = useQuery({
		queryKey: entityKeys.list({ limit: 1 }),
		queryFn: () => getEntities({ limit: 1 }),
		staleTime: 30_000,
	})
	const entityCount = entityData?.total

	const { data: editsData } = useQuery({
		queryKey: ['edits', 'sidebar'],
		queryFn: () => getEdits({ limit: 1 }),
		staleTime: 30_000,
	})
	const editsCount = editsData?.edits?.length

	return (
		<div className="h-screen bg-background flex font-sans text-foreground text-sm tracking-[-0.01em]">
			{/* Sidebar */}
			<aside
				data-testid="sidebar"
				className="w-[232px] bg-[var(--sidebar)] border-r border-border flex flex-col shrink-0"
			>
				{/* Brand block */}
				<Link to="/" className="block px-4 pt-[18px] pb-4 border-b border-line-soft no-underline">
					<div className="flex items-center gap-2">
						<LogoIcon />
						<div>
							<div className="font-semibold text-sm tracking-[-0.2px]">Geo</div>
							<div className="text-xs text-muted-foreground font-mono">Local</div>
						</div>
					</div>
				</Link>

				{/* Explore group */}
				<div className="px-2.5 pt-2.5 pb-1">
					<div className="text-xs text-[var(--color-muted-foreground)]/[0.6] uppercase tracking-[1px] px-2 py-1.5 font-semibold">
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
										'w-full flex items-center gap-2.5 px-2 py-[7px] rounded-md border-none cursor-pointer font-inherit text-sm text-left no-underline'
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
											<span className="text-xs text-[#a1a1aa] font-mono tabular-nums">
												{count.toLocaleString()}
											</span>
										)}
									</>
								)}
							</RouterNavLink>
						)
					})}
				</div>

				<div className="flex-1" />

				{/* Footer */}
				<div className="px-3.5 py-2.5 border-t border-line-soft">
					<span className="text-xs text-muted-foreground font-mono">local · 0.2</span>
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
						className="flex items-center gap-1.5 text-xs text-muted-foreground"
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
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
