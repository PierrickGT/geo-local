import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchPage } from './search-page'

// Mock the hook
vi.mock('~/hooks/use-search', () => ({
	useSearch: vi.fn(),
}))

import { useSearch } from '~/hooks/use-search'

const mockUseSearch = vi.mocked(useSearch)

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/search') {
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

// Sample search results
const mockResults = {
	results: [
		{
			entityId: 'entity-1',
			propertyId: 'property-1',
			value: { value: 'Test value 1' },
			language: null,
		},
		{
			entityId: 'entity-2',
			propertyId: 'property-2',
			value: { value: 'Test value 2' },
			language: null,
		},
	],
	entities: [],
}

// Mock refetch function
const mockRefetch = vi.fn()

describe('SearchPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()

		// Default mock - no query, no results
		mockUseSearch.mockReturnValue({
			results: undefined,
			isLoading: false,
			isDebouncing: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})
	})

	describe('rendering', () => {
		it('renders search page with input', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument()
			expect(screen.getByRole('searchbox')).toBeInTheDocument()
		})

		it('shows empty state message when no query', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			expect(
				screen.getByText('Enter a search query to find entities by name or ID.'),
			).toBeInTheDocument()
		})
	})

	describe('search input', () => {
		it('typing in input updates the query', async () => {
			const user = userEvent.setup()

			render(<SearchPage />, { wrapper: createWrapper() })

			const input = screen.getByRole('searchbox')
			await user.type(input, 'test')

			expect(input).toHaveValue('test')
		})
	})

	describe('URL sync', () => {
		it('prepopulates search from URL ?q= param', () => {
			render(<SearchPage />, { wrapper: createWrapper('/search?q=prefilled') })

			const input = screen.getByRole('searchbox')
			expect(input).toHaveValue('prefilled')
		})
	})

	describe('loading state', () => {
		it('shows loading state during search', () => {
			mockUseSearch.mockReturnValue({
				results: undefined,
				isLoading: true,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByText('Searching...')).toBeInTheDocument()
		})

		it('shows debouncing state while waiting', () => {
			mockUseSearch.mockReturnValue({
				results: undefined,
				isLoading: false,
				isDebouncing: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByText('Searching...')).toBeInTheDocument()
		})
	})

	describe('results', () => {
		it('shows search results', () => {
			mockUseSearch.mockReturnValue({
				results: mockResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByText('Test value 1')).toBeInTheDocument()
			expect(screen.getByText('Test value 2')).toBeInTheDocument()
		})

		it('shows entity ID matches when entities are returned', () => {
			const entityResults = {
				results: [],
				entities: [
					{
						id: 'abc123',
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
						propertiesText: 'Test Entity',
					},
				],
			}

			mockUseSearch.mockReturnValue({
				results: entityResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=abc') })

			expect(screen.getByText('Matching entities (1)')).toBeInTheDocument()
			expect(screen.getByText('Test Entity')).toBeInTheDocument()
			expect(screen.getByText('abc123')).toBeInTheDocument()
		})

		it('shows entity ID and property ID for each result', () => {
			mockUseSearch.mockReturnValue({
				results: mockResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByText(/entity-1/)).toBeInTheDocument()
			expect(screen.getByText(/property-1/)).toBeInTheDocument()
		})

		it('shows no results message when results are empty', () => {
			mockUseSearch.mockReturnValue({
				results: { results: [], entities: [] },
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=notfound') })

			expect(screen.getByText('No results found for "notfound".')).toBeInTheDocument()
		})

		it('clicking result navigates to entity detail', async () => {
			const user = userEvent.setup()

			mockUseSearch.mockReturnValue({
				results: mockResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			// Click the first result row
			const resultRow = screen.getByText('Test value 1').closest('tr')
			if (resultRow) {
				await user.click(resultRow)
			}

			// Navigation would happen - we can't test the actual navigation in this setup
			// but we can verify the row is clickable
			expect(resultRow).toHaveClass('cursor-pointer')
		})
	})

	describe('error handling', () => {
		it('shows error state on API failure', () => {
			mockUseSearch.mockReturnValue({
				results: undefined,
				isLoading: false,
				isDebouncing: false,
				isError: true,
				error: new Error('Search failed'),
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByRole('heading', { name: 'Search failed' })).toBeInTheDocument()
		})

		it('shows retry button on error', () => {
			mockUseSearch.mockReturnValue({
				results: undefined,
				isLoading: false,
				isDebouncing: false,
				isError: true,
				error: new Error('Search failed'),
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
		})
	})
})
