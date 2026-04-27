import type * as React from 'react'
import { type NavLinkRenderProps, NavLink as RouterNavLink } from 'react-router'

type NavLinkChildren = React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode)

interface NavLinkOwnProps {
	to: string
	children?: NavLinkChildren
	className?: string | ((props: NavLinkRenderProps) => string)
}

export function NavLink({
	to,
	children,
	className,
	...props
}: NavLinkOwnProps & Omit<React.ComponentProps<'a'>, 'className'>) {
	return (
		<RouterNavLink
			to={to}
			className={
				typeof className === 'function'
					? className
					: ({ isActive }) => {
							const baseClasses =
								'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
							const activeClasses = isActive
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
							return `${baseClasses} ${activeClasses} ${className ?? ''}`
						}
			}
			{...props}
		>
			{typeof children === 'function' ? (renderProps) => children(renderProps) : children}
		</RouterNavLink>
	)
}
