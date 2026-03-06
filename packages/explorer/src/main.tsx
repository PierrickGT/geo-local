import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { queryClient } from '~/lib/query-client'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<h1 className="text-2xl font-semibold text-gray-900">Knowledge Graph Explorer</h1>
			</div>
		</QueryClientProvider>
	</StrictMode>,
)
