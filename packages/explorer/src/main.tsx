import { QueryClientProvider } from '@tanstack/react-query'
import { Agentation } from 'agentation'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '~/app/router'
import { queryClient } from '~/lib/query-client'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
		{import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
	</StrictMode>,
)
