import { createContext, useContext, useState } from 'react'

/**
 * Context for child pages to override breadcrumb segments.
 * The Layout reads from this context; pages can call useSetBreadcrumb
 * to provide custom text (e.g., entity name in "Entities › Name › Edit").
 */

interface BreadcrumbContextValue {
	/** Extra segments to append after the default first segment */
	extraSegments: string[] | null
	setExtraSegments: (segments: string[] | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
	extraSegments: null,
	setExtraSegments: () => {},
})

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
	const [extraSegments, setExtraSegments] = useState<string[] | null>(null)

	return (
		<BreadcrumbContext.Provider value={{ extraSegments, setExtraSegments }}>
			{children}
		</BreadcrumbContext.Provider>
	)
}

export function useBreadcrumbExtra(): string[] | null {
	return useContext(BreadcrumbContext).extraSegments
}

export function useSetBreadcrumb() {
	return useContext(BreadcrumbContext).setExtraSegments
}
