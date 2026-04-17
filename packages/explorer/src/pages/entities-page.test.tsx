import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { EntitiesPage } from './entities-page'

vi.mock('~/api/entities', () => ({
	getEntities: vi.fn().mockResolvedValue({
		entities: [
			{
				id: 'aaaabbbbcccc',
				createdAt: '2025-01-01T00:00:00Z',
				updatedAt: '2025-01-02T00:00:00Z',
				propertiesText: 'Entity A',
			},
		],
		total: 1,
	}),
	getTypes: vi.fn().mockResolvedValue([]),
}))

function renderWithRouter(initialPath: string) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[initialPath]}>
				<Routes>
					<Route path="/entities" element={<EntitiesPage />} />
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	)
}

describe('EntitiesPage URL sort sync', () => {
	it('reads sort and order from URL params', async () => {
		renderWithRouter('/entities?sort=created_at&order=asc')

		await waitFor(() => {
			expect(screen.getByText('Created').className).toContain('text-blue-600')
		})
	})

	it('uses default sort when no URL params present', async () => {
		renderWithRouter('/entities')

		await waitFor(() => {
			expect(screen.getByText('Updated').className).toContain('text-blue-600')
		})
	})

	it('updates sort when column is clicked', async () => {
		renderWithRouter('/entities')

		await waitFor(() => {
			expect(screen.getByText('Entity A')).toBeTruthy()
		})

		await userEvent.click(screen.getByText('Created'))

		await waitFor(() => {
			expect(screen.getByText('Created').className).toContain('text-blue-600')
		})
	})
})
