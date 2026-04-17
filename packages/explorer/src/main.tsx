import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '~/app/router'
import { queryClient } from '~/lib/query-client'
import './index.css'

const Agentation = import.meta.env.DEV
	? lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
	: null

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
		{Agentation && (
			<Suspense>
				<Agentation endpoint="http://localhost:4747" />
			</Suspense>
		)}
	</StrictMode>,
)
