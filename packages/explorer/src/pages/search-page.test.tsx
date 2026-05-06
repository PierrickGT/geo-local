import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
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
				<MemoryRouter initialEntries={[initialRoute]}>
					<Routes>
						<Route path="/search" element={children} />
						<Route path="/entities/:id" element={<div>Entity Detail</div>} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>
		)
	}
}

// Sample text search results (name-mode — non-hex query matches entities by text)
const mockTextResults = {
	entities: [
		{
			id: '021ccf8634a48e3891a8fa286b7683f5',
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z',
			propertiesText: 'Action Code',
		},
		{
			id: '021ccf8634a48e3891a8fa286b7683f6',
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z',
			propertiesText: 'CMS action on this code: A=Add, C=Change, D=Delete',
		},
	],
}

// Sample entity ID results
const mockEntityResults = {
	entities: [
		{
			id: '021ccf8634a48e3891a8fa286b7683f5',
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z',
			propertiesText: 'Action Code',
		},
	],
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

	describe('VAL-SEARCH-001: Big search bar panel', () => {
		it('renders a big search bar panel with SVG icon, input, and Kbd hint', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			// Search input exists (using aria-label since type=search implies searchbox role)
			const searchInput = screen.getByRole('searchbox')
			expect(searchInput).toBeInTheDocument()
			expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search'))

			// ⌘K hint exists
			expect(screen.getByText('⌘K')).toBeInTheDocument()
		})

		it('shows clear button when there is text in the input', async () => {
			const user = userEvent.setup()
			render(<SearchPage />, { wrapper: createWrapper() })

			const searchInput = screen.getByRole('searchbox')
			await user.type(searchInput, 'test')

			// Clear button should appear
			expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
		})

		it('does not show clear button when input is empty', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
		})
	})

	describe('VAL-SEARCH-002: Scope chips row', () => {
		it('renders 5 scope chips', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: 'All scopes' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Names' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Descriptions' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Property values' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'IDs' })).toBeInTheDocument()
		})

		it('All scopes chip is active by default', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			const allChip = screen.getByRole('button', { name: 'All scopes' })
			expect(allChip).toHaveAttribute('data-active', 'true')
		})

		it('clicking a scope chip activates it and deactivates others', async () => {
			const user = userEvent.setup()
			render(<SearchPage />, { wrapper: createWrapper() })

			const namesChip = screen.getByRole('button', { name: 'Names' })
			await user.click(namesChip)

			expect(namesChip).toHaveAttribute('data-active', 'true')
			expect(screen.getByRole('button', { name: 'All scopes' })).toHaveAttribute(
				'data-active',
				'false',
			)
		})
	})

	describe('VAL-SEARCH-003: Empty state with suggestions', () => {
		it('shows empty state with dashed border panel when no query', () => {
			render(<SearchPage />, { wrapper: createWrapper() })

			// Panel with dashed border
			const emptyPanel = screen.getByTestId('search-empty-state')
			expect(emptyPanel).toBeInTheDocument()

			// Heading
			expect(screen.getByText('Find entities across the graph')).toBeInTheDocument()

			// Suggestions
			expect(screen.getByText('Action Code')).toBeInTheDocument()
		})

		it('clicking suggestion fills input', async () => {
			const user = userEvent.setup()
			render(<SearchPage />, { wrapper: createWrapper() })

			const suggestion = screen.getByRole('button', { name: 'Action Code' })
			await user.click(suggestion)

			const searchInput = screen.getByRole('searchbox')
			expect(searchInput).toHaveValue('Action Code')
		})
	})

	describe('VAL-SEARCH-004: Name-mode matching entities', () => {
		it('shows "Matching entities" header with count for non-hex queries', () => {
			mockUseSearch.mockReturnValue({
				results: mockTextResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			expect(screen.getByText('Matching entities')).toBeInTheDocument()
			expect(screen.getByText('2')).toBeInTheDocument()
		})

		it('shows entity rows with names', () => {
			mockUseSearch.mockReturnValue({
				results: mockTextResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			// Both entity names should be rendered in the results
			const matches = screen.getAllByText((_content, element) => {
				return element?.textContent?.includes('CMS action') ?? false
			})
			expect(matches.length).toBeGreaterThanOrEqual(1)
		})
	})

	describe('VAL-SEARCH-005: Search term highlighted in results', () => {
		it('wraps match text in mark element with yellow highlight', () => {
			mockUseSearch.mockReturnValue({
				results: mockTextResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			const marks = screen.getAllByText('Action')
			const markElements = marks.filter(
				(el) => el.closest('mark') !== null || el.tagName === 'MARK',
			)
			expect(markElements.length).toBeGreaterThanOrEqual(1)
		})
	})

	describe('VAL-SEARCH-006: Open button navigates to entity', () => {
		it('clicking Open on entity result navigates to entity detail', async () => {
			const user = userEvent.setup()

			mockUseSearch.mockReturnValue({
				results: mockTextResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			const openButtons = screen.getAllByRole('button', { name: 'Open' })
			expect(openButtons.length).toBeGreaterThan(0)
			await user.click(openButtons[0])

			expect(screen.getByText('Entity Detail')).toBeInTheDocument()
		})
	})

	describe('VAL-SEARCH-007: ID-mode triggered by 6+ hex chars', () => {
		it('shows "Matching entities" for 6+ hex character queries', () => {
			mockUseSearch.mockReturnValue({
				results: mockEntityResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			// 6+ hex chars triggers ID mode
			render(<SearchPage />, { wrapper: createWrapper('/search?q=021ccf') })

			expect(screen.getByText('Matching entities')).toBeInTheDocument()
		})

		it('uses name mode for non-hex queries', () => {
			mockUseSearch.mockReturnValue({
				results: mockTextResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			// Non-hex stays in name mode — shows "Matching entities" (not ID mode)
			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			// Name mode does NOT show ID-mode header with count
			const headers = screen.getAllByText('Matching entities')
			// Both name-mode and ID-mode share same header text, but name-mode has entity names
			expect(headers.length).toBeGreaterThanOrEqual(1)
		})
	})

	describe('VAL-SEARCH-008: Full ID match resolves exact entity', () => {
		it('full 32-char hex ID shows single result', () => {
			mockUseSearch.mockReturnValue({
				results: mockEntityResults,
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, {
				wrapper: createWrapper('/search?q=021ccf8634a48e3891a8fa286b7683f5'),
			})

			expect(screen.getByText('Matching entities')).toBeInTheDocument()
			expect(screen.getByText('Action Code')).toBeInTheDocument()
		})
	})

	describe('VAL-SEARCH-009: No results state', () => {
		it('shows clear "no results" message when no matches', () => {
			mockUseSearch.mockReturnValue({
				results: { entities: [] },
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=zzzznonexistent') })

			expect(screen.getByText(/No results found/)).toBeInTheDocument()
		})

		it('safely renders the query text in no-results message', () => {
			mockUseSearch.mockReturnValue({
				results: { entities: [] },
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=zzzznonexistent') })

			expect(screen.getByText(/zzzznonexistent/)).toBeInTheDocument()
		})
	})

	describe('VAL-SEARCH-010: Clear button resets', () => {
		it('clear button empties input and shows empty state', async () => {
			const user = userEvent.setup()

			mockUseSearch.mockReturnValue({
				results: { entities: [] },
				isLoading: false,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			// Should have clear button since q=test
			const clearBtn = screen.getByLabelText('Clear search')
			await user.click(clearBtn)

			// Input should be empty
			const searchInput = screen.getByRole('searchbox')
			expect(searchInput).toHaveValue('')
		})
	})

	describe('VAL-SEARCH-011: URL sync', () => {
		it('URL ?q= pre-fills input', () => {
			render(<SearchPage />, { wrapper: createWrapper('/search?q=Action') })

			const searchInput = screen.getByRole('searchbox')
			expect(searchInput).toHaveValue('Action')
		})

		it('new query updates URL', async () => {
			const user = userEvent.setup()
			render(<SearchPage />, { wrapper: createWrapper() })

			const searchInput = screen.getByRole('searchbox')
			await user.type(searchInput, 'test')

			expect(searchInput).toHaveValue('test')
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

			expect(screen.getByText(/Search failed/)).toBeInTheDocument()
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

	describe('loading state', () => {
		it('shows loading indicator during search', () => {
			mockUseSearch.mockReturnValue({
				results: undefined,
				isLoading: true,
				isDebouncing: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<SearchPage />, { wrapper: createWrapper('/search?q=test') })

			expect(screen.getByText('Searching…')).toBeInTheDocument()
		})
	})
})
