import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EntitiesPage } from './entities-page'

// Mock the hooks
vi.mock('~/hooks/use-entities', () => ({
	useEntities: vi.fn(),
	useTypes: vi.fn(),
}))

vi.mock('~/hooks/use-mutations', () => ({
	useDeleteEntities: vi.fn(),
}))

import { useEntities, useTypes } from '~/hooks/use-entities'
import { useDeleteEntities } from '~/hooks/use-mutations'

const mockUseEntities = vi.mocked(useEntities)
const mockUseTypes = vi.mocked(useTypes)
const mockUseDeleteEntities = vi.mocked(useDeleteEntities)

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/entities') {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	})

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
			</QueryClientProvider>
		)
	}
}

// Sample data
const mockEntities = {
	entities: [
		{
			id: 'entity-1',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
		{
			id: 'entity-2',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
	],
	total: 2,
	limit: 20,
	offset: 0,
}

const mockTypes = [
	{ id: 'type-1', name: 'Person' },
	{ id: 'type-2', name: 'Organization' },
	{ id: 'type-3', name: 'Event' },
]

// Mock refetch function
const mockRefetch = vi.fn()

// Default useDeleteEntities mock
function createDefaultDeleteEntitiesMock() {
	return {
		mutate: vi.fn(),
		mutateAsync: vi.fn().mockResolvedValue({ id: 'edit-id' }),
		isLoading: false,
		error: null,
		reset: vi.fn(),
		data: undefined,
	}
}

describe('EntitiesPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()

		// Default mocks
		mockUseEntities.mockReturnValue({
			entities: mockEntities,
			total: 2,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})

		mockUseTypes.mockReturnValue({
			types: mockTypes,
			isLoading: false,
			isError: false,
			error: null,
		})

		mockUseDeleteEntities.mockReturnValue(createDefaultDeleteEntitiesMock())
	})

	describe('rendering', () => {
		it('renders entity list with default pagination', async () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			// CardTitle renders as a div, not a heading element
			expect(screen.getByText('Entities')).toBeInTheDocument()
			expect(screen.getByText('entity-1')).toBeInTheDocument()
			expect(screen.getByText('entity-2')).toBeInTheDocument()
		})

		it('renders Create Entity button in header', () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('create-entity-button')).toBeInTheDocument()
			expect(screen.getByTestId('create-entity-button')).toHaveTextContent('Create Entity')
		})

		it('shows loading state while fetching entities', () => {
			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// UI now uses skeleton spinners instead of text loading states
			const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
			expect(skeletons.length).toBeGreaterThan(0)
		})
	})

	describe('type filter', () => {
		it('renders type filter dropdown with options', () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByLabelText('Filter by type:')).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'All types' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Person' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Organization' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Event' })).toBeInTheDocument()
		})

		it('selecting type filters list and updates URL', async () => {
			const user = userEvent.setup()

			render(<EntitiesPage />, { wrapper: createWrapper() })

			const select = screen.getByLabelText('Filter by type:')
			await user.selectOptions(select, 'type-1')

			// Verify useEntities was called with the type filter
			expect(mockUseEntities).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'type-1',
				}),
			)
		})

		it('clearing type filter shows all entities', async () => {
			const user = userEvent.setup()

			// Start with a type filter in URL
			render(<EntitiesPage />, { wrapper: createWrapper('/entities?type=type-1') })

			const select = screen.getByLabelText('Filter by type:')
			await user.selectOptions(select, '')

			// Verify useEntities was called without type filter
			expect(mockUseEntities).toHaveBeenCalledWith(
				expect.objectContaining({
					type: undefined,
				}),
			)
		})
	})

	describe('pagination', () => {
		it('shows pagination controls', () => {
			mockUseEntities.mockReturnValue({
				entities: {
					...mockEntities,
					total: 100,
				},
				total: 100,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Pagination links are rendered as <a> tags with aria-labels
			expect(screen.getByLabelText('Go to first page')).toBeInTheDocument()
			expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
			expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
			expect(screen.getByLabelText('Go to last page')).toBeInTheDocument()
		})

		it('clicking next updates offset', async () => {
			const user = userEvent.setup()

			mockUseEntities.mockReturnValue({
				entities: {
					...mockEntities,
					total: 100,
				},
				total: 100,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Pagination links are <a> tags with aria-labels, not buttons
			await user.click(screen.getByLabelText('Go to next page'))

			// Verify useEntities was called with updated offset
			expect(mockUseEntities).toHaveBeenCalledWith(
				expect.objectContaining({
					offset: 20,
				}),
			)
		})
	})

	describe('error handling', () => {
		it('shows error state on API failure', () => {
			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Failed to load entities')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})

		it('shows retry button on error', () => {
			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
		})

		it('clicking retry calls refetch', async () => {
			const user = userEvent.setup()

			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: 'Retry' }))

			expect(mockRefetch).toHaveBeenCalledTimes(1)
		})
	})

	describe('URL sync', () => {
		it('initializes with URL params on load', () => {
			render(<EntitiesPage />, {
				wrapper: createWrapper('/entities?type=type-1&limit=10&offset=20'),
			})

			// Verify useEntities was called with URL params
			expect(mockUseEntities).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'type-1',
					limit: 10,
					offset: 20,
				}),
			)
		})
	})

	describe('empty state', () => {
		it('shows empty state when no results', () => {
			mockUseEntities.mockReturnValue({
				entities: {
					entities: [],
					total: 0,
					limit: 20,
					offset: 0,
				},
				total: 0,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByText('No entities found.')).toBeInTheDocument()
		})
	})

	describe('batch delete', () => {
		it('does not show Delete (N) button when no entities are selected', () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.queryByTestId('batch-delete-button')).not.toBeInTheDocument()
		})

		it('shows Delete (N) button with correct count when entities are selected', async () => {
			const user = userEvent.setup()

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select first entity via checkbox
			const checkboxes = screen.getAllByRole('checkbox')
			// First checkbox is the header (select-all), second and third are row checkboxes
			await user.click(checkboxes[1]) // Select entity-1

			const batchDeleteBtn = screen.getByTestId('batch-delete-button')
			expect(batchDeleteBtn).toBeInTheDocument()
			expect(batchDeleteBtn).toHaveTextContent('Delete (1)')

			// Select second entity
			await user.click(checkboxes[2]) // Select entity-2

			expect(batchDeleteBtn).toHaveTextContent('Delete (2)')
		})

		it('Delete (N) button disappears when selection is cleared', async () => {
			const user = userEvent.setup()

			render(<EntitiesPage />, { wrapper: createWrapper() })

			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1]) // Select entity-1

			expect(screen.getByTestId('batch-delete-button')).toBeInTheDocument()

			// Deselect
			await user.click(checkboxes[1])

			expect(screen.queryByTestId('batch-delete-button')).not.toBeInTheDocument()
		})

		it('opens batch delete dialog showing entity count', async () => {
			const user = userEvent.setup()

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select two entities
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(checkboxes[2])

			await user.click(screen.getByTestId('batch-delete-button'))

			// Dialog should be open with correct count
			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(
				screen.getByRole('dialog').querySelector('[data-slot="dialog-title"]'),
			).toHaveTextContent('Delete Entities')
			// Text is split by <span> elements, target the description element
			const description = screen
				.getByRole('dialog')
				.querySelector('[data-slot="dialog-description"]')
			expect(description?.textContent).toContain('2 entities')
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
			expect(screen.getByTestId('confirm-batch-delete-button')).toBeInTheDocument()
		})

		it('dialog cancel resets mutation state', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				reset: resetFn,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities and open dialog
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(screen.getByTestId('batch-delete-button'))

			// Cancel dialog
			await user.click(screen.getByRole('button', { name: 'Cancel' }))

			expect(resetFn).toHaveBeenCalled()
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		})

		it('batch delete success clears selection and closes dialog', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			const resetFn = vi.fn()
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				mutateAsync: mutateAsyncFn,
				reset: resetFn,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities and open dialog
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(checkboxes[2])
			await user.click(screen.getByTestId('batch-delete-button'))

			// Confirm deletion
			await user.click(screen.getByTestId('confirm-batch-delete-button'))

			expect(mutateAsyncFn).toHaveBeenCalledWith({
				ids: ['entity-1', 'entity-2'],
			})

			// Wait for async resolution
			await screen.findByText('Entities')

			// Dialog should be closed and no batch delete button visible (selection cleared)
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(screen.queryByTestId('batch-delete-button')).not.toBeInTheDocument()
		})

		it('batch delete error keeps dialog open with error message', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockRejectedValue(new Error('Deletion failed'))
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: new Error('Deletion failed'),
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities and open dialog
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(screen.getByTestId('batch-delete-button'))

			// Confirm deletion
			await user.click(screen.getByTestId('confirm-batch-delete-button'))

			// Dialog should still be open with error
			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(screen.getByTestId('batch-delete-error')).toHaveTextContent('Deletion failed')

			// Delete button should still be enabled for retry
			expect(screen.getByTestId('confirm-batch-delete-button')).toBeEnabled()
		})

		it('delete button disabled with spinner during loading', async () => {
			const user = userEvent.setup()
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				mutateAsync: vi.fn(), // never resolves — stays pending
				isLoading: true,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities and open dialog
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(screen.getByTestId('batch-delete-button'))

			// Both buttons should be disabled during loading
			const dialog = screen.getByRole('dialog')
			const buttons = dialog.querySelectorAll('button')
			const confirmBtn = Array.from(buttons).find((b) => b.textContent?.includes('Delete'))
			const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('Cancel'))
			expect(confirmBtn).toBeDisabled()
			expect(cancelBtn).toBeDisabled()

			// Spinner should be visible
			expect(confirmBtn?.querySelector('[role="status"]')).toBeInTheDocument()
		})

		it('selection clears on page change', async () => {
			const user = userEvent.setup()

			mockUseEntities.mockReturnValue({
				entities: {
					...mockEntities,
					total: 100,
				},
				total: 100,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			expect(screen.getByTestId('batch-delete-button')).toBeInTheDocument()

			// Navigate to next page
			await user.click(screen.getByLabelText('Go to next page'))

			// Selection should be cleared — batch delete button gone
			expect(screen.queryByTestId('batch-delete-button')).not.toBeInTheDocument()
		})

		it('select-all selects all entities on current page', async () => {
			const user = userEvent.setup()

			mockUseEntities.mockReturnValue({
				entities: {
					entities: [
						{
							id: 'entity-1',
							createdAt: '2024-01-01T00:00:00Z',
							updatedAt: '2024-01-02T00:00:00Z',
						},
						{
							id: 'entity-2',
							createdAt: '2024-01-01T00:00:00Z',
							updatedAt: '2024-01-02T00:00:00Z',
						},
						{
							id: 'entity-3',
							createdAt: '2024-01-01T00:00:00Z',
							updatedAt: '2024-01-02T00:00:00Z',
						},
					],
					total: 3,
					limit: 20,
					offset: 0,
				},
				total: 3,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Click header checkbox (select-all)
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[0]) // Header checkbox

			// Should show Delete (3) — all entities selected
			expect(screen.getByTestId('batch-delete-button')).toHaveTextContent('Delete (3)')
		})

		it('closing dialog resets error state for clean reopen', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()

			// First render: dialog with error
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				isLoading: false,
				error: new Error('Some error'),
				reset: resetFn,
			})

			render(<EntitiesPage />, { wrapper: createWrapper() })

			// Select entities and open dialog
			const checkboxes = screen.getAllByRole('checkbox')
			await user.click(checkboxes[1])
			await user.click(screen.getByTestId('batch-delete-button'))

			expect(screen.getByTestId('batch-delete-error')).toBeInTheDocument()

			// Close via Cancel
			await user.click(screen.getByRole('button', { name: 'Cancel' }))
			expect(resetFn).toHaveBeenCalled()

			// Re-open — update mock to have no error
			mockUseDeleteEntities.mockReturnValue({
				...createDefaultDeleteEntitiesMock(),
				isLoading: false,
				error: null,
				reset: vi.fn(),
			})

			await user.click(screen.getByTestId('batch-delete-button'))
			expect(screen.queryByTestId('batch-delete-error')).not.toBeInTheDocument()
		})
	})
})
