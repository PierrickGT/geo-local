/**
 * TanStack Query client configuration
 * Global QueryClient with sensible defaults
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Global QueryClient instance with default options.
 *
 * Configuration:
 * - staleTime: 30_000ms - Data is fresh for 30 seconds
 * - retry: 1 - Retry failed queries once
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
		},
	},
})
