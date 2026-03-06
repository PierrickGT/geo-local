import { type NavLinkProps, NavLink as RouterNavLink } from 'react-router'

export function NavLink({ to, children, className = '', ...props }: NavLinkProps) {
	return (
		<RouterNavLink
			to={to}
			className={({ isActive }) => {
				const baseClasses =
					'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
				const activeClasses = isActive
					? 'bg-blue-100 text-blue-700'
					: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
				return `${baseClasses} ${activeClasses} ${className}`
			}}
			{...props}
		>
			{children}
		</RouterNavLink>
	)
}
