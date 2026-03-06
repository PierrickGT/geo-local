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

import { useEntities, useTypes } from '~/hooks/use-entities'

const mockUseEntities = vi.mocked(useEntities)
const mockUseTypes = vi.mocked(useTypes)

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
			status: 'alive' as const,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
		{
			id: 'entity-2',
			status: 'alive' as const,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
	],
	total: 2,
	limit: 20,
	offset: 0,
}

const mockTypes = ['type-1', 'type-2', 'type-3']

// Mock refetch function
const mockRefetch = vi.fn()

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
	})

	describe('rendering', () => {
		it('renders entity list with default pagination', async () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Entities' })).toBeInTheDocument()
			expect(screen.getByText('entity-1')).toBeInTheDocument()
			expect(screen.getByText('entity-2')).toBeInTheDocument()
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

			expect(screen.getByText('Loading entities...')).toBeInTheDocument()
		})
	})

	describe('type filter', () => {
		it('renders type filter dropdown with options', () => {
			render(<EntitiesPage />, { wrapper: createWrapper() })

			expect(screen.getByLabelText('Filter by type:')).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'All types' })).toBeInTheDocument()
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

			expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Last' })).toBeInTheDocument()
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

			await user.click(screen.getByRole('button', { name: 'Next' }))

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
})
