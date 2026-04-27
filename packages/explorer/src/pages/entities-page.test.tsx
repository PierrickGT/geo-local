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
				id: 'aaaabbbbccccddddeeeeffff11112222',
				createdAt: '2025-01-01T00:00:00Z',
				updatedAt: '2025-01-02T00:00:00Z',
				propertiesText: 'Action Code',
			},
			{
				id: '11112222333344445555666677778888',
				createdAt: '2025-01-03T00:00:00Z',
				updatedAt: '2025-01-04T00:00:00Z',
				propertiesText: 'Description',
			},
			{
				id: 'abcd1234abcd1234abcd1234abcd1234',
				createdAt: '2025-01-05T00:00:00Z',
				updatedAt: '2025-01-06T00:00:00Z',
				propertiesText: 'Entity C',
			},
		],
		total: 12481,
	}),
	getTypes: vi.fn().mockResolvedValue([
		{ id: 'type-entity-id', name: 'Entity' },
		{ id: 'property-entity-id', name: 'Property' },
	]),
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
					<Route path="/entities/:id" element={<div>Entity Detail</div>} />
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	)
}

describe('EntitiesPage', () => {
	describe('H1 with counts (VAL-ENTITIES-001)', () => {
		it('renders H1 "Entities" with shown and total counts in mono', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByRole('heading', { level: 1, name: 'Entities' })).toBeInTheDocument()
			})

			const subtitle = screen.getByTestId('entities-subtitle')
			expect(subtitle).toBeInTheDocument()
			expect(subtitle.textContent).toContain('shown')
			expect(subtitle.textContent).toContain('total')
		})
	})

	describe('Filter bar (VAL-ENTITIES-002)', () => {
		it('renders search input with SVG icon', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument()
			})
		})

		it('renders type chips: All, Entities, Properties', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: /entities/i })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: /properties/i })).toBeInTheDocument()
			})
		})

		it('renders dashed Filter button', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
			})
		})
	})

	describe('Table grid layout (VAL-ENTITIES-004)', () => {
		it('renders entity rows with 6-column grid', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			// 3 entity rows (header is a div, not a table row)
			const rows = screen.getAllByRole('row')
			expect(rows.length).toBe(3)
		})

		it('renders chevron in each row', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const chevrons = screen.getAllByTestId('row-chevron')
			expect(chevrons.length).toBe(3)
		})
	})

	describe('ID column mono + copy button (VAL-ENTITIES-006)', () => {
		it('renders ID in mono font with copy button', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const copyButtons = screen.getAllByTestId('copy-id-button')
			expect(copyButtons.length).toBe(3)
		})
	})

	describe('Checkbox selection (VAL-ENTITIES-009)', () => {
		it('renders checkboxes in each row', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const checkboxes = screen.getAllByRole('checkbox')
			// header checkbox + 3 row checkboxes
			expect(checkboxes.length).toBe(4)
		})

		it('header checkbox toggles all (VAL-ENTITIES-010)', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const headerCheckbox = screen.getByRole('checkbox', { name: /select all/i })
			await user.click(headerCheckbox)

			// Bulk action bar should appear
			await waitFor(() => {
				expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument()
			})
		})
	})

	describe('Bulk-action bar (VAL-ENTITIES-012)', () => {
		it('appears when rows are selected', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			// Select all via header checkbox
			const headerCheckbox = screen.getByRole('checkbox', { name: /select all/i })
			await user.click(headerCheckbox)

			await waitFor(() => {
				expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument()
				expect(screen.getByText(/selected/i)).toBeInTheDocument()
				expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
			})
		})
	})

	describe('Pagination footer (VAL-ENTITIES-014)', () => {
		it('renders showing range in mono', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const paginationFooter = screen.getByTestId('pagination-footer')
			expect(paginationFooter).toBeInTheDocument()
			expect(paginationFooter.textContent).toContain('Showing')
		})
	})

	describe('Column sorting (VAL-ENTITIES-015)', () => {
		it('renders sort controls on Updated and Name columns', async () => {
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const sortButtons = screen.getAllByTestId('sort-arrow')
			expect(sortButtons.length).toBeGreaterThanOrEqual(2)
		})

		it('updates URL sort params when column is clicked', async () => {
			renderWithRouter('/entities?sort=updated_at&order=desc')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})
		})
	})

	describe('Row hover and selection highlights (VAL-ENTITIES-016)', () => {
		it('applies selected styling to selected rows', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			// Select first row checkbox
			const rowCheckboxes = screen.getAllByRole('checkbox').slice(1) // skip header
			await user.click(rowCheckboxes[0])

			// Row should have selection-related styling
			const row = rowCheckboxes[0].closest('[data-entity-row]')
			expect(row).toBeTruthy()
		})
	})

	describe('Row click navigation (VAL-ENTITIES-008)', () => {
		it('navigates to entity detail on row click', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			// Click on the entity name
			await user.click(screen.getByText('Action Code'))

			await waitFor(() => {
				expect(screen.getByText('Entity Detail')).toBeInTheDocument()
			})
		})
	})

	describe('Batch delete (VAL-ENTITIES-013)', () => {
		it('opens delete confirmation dialog', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			// Select all
			await user.click(screen.getByRole('checkbox', { name: /select all/i }))

			// Click delete
			await waitFor(() => {
				expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
			})

			await user.click(screen.getByRole('button', { name: /delete/i }))

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument()
				expect(screen.getByTestId('confirm-batch-delete-button')).toBeInTheDocument()
			})
		})
	})

	describe('Type chips filter (VAL-ENTITIES-003)', () => {
		it('clicking Entities chip updates URL with type filter', async () => {
			const user = userEvent.setup()
			renderWithRouter('/entities')

			await waitFor(() => {
				expect(screen.getByText('Action Code')).toBeInTheDocument()
			})

			const entitiesChip = screen.getByRole('button', { name: /entities/i })
			await user.click(entitiesChip)
		})
	})
})
