import { Outlet } from 'react-router'
import { NavLink } from '~/components/ui/nav-link'

const navItems = [
	{ to: '/entities', label: 'Entities', icon: '📋' },
	{ to: '/search', label: 'Search', icon: '🔍' },
	{ to: '/graph', label: 'Graph', icon: '🔗' },
	{ to: '/edits', label: 'Edits', icon: '📝' },
]

export function Layout() {
	return (
		<div className="h-screen bg-gray-50 flex">
			{/* Sidebar */}
			<aside className="w-64 bg-white flex flex-col shrink-0">
				{/* Header */}
				<div className="p-4">
					<h1 className="text-lg font-semibold text-gray-900">Knowledge Graph</h1>
					<p className="text-xs text-gray-500">Explorer</p>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4 space-y-1">
					{navItems.map((item) => (
						<NavLink key={item.to} to={item.to}>
							<span className="text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</NavLink>
					))}
				</nav>

				{/* Footer */}
				<div className="p-4">
					<p className="text-xs text-gray-400">Geo Runtime v0.1</p>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">
				<Outlet />
			</main>
		</div>
	)
}
