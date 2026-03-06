import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditsPage } from './edits-page'

// Mock the hook
vi.mock('~/hooks/use-edits', () => ({
	useEdits: vi.fn(),
}))

import { useEdits } from '~/hooks/use-edits'

const mockUseEdits = vi.mocked(useEdits)

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/edits') {
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

// Sample edits
const mockEdits = {
	edits: [
		{
			id: 'edit-1',
			spaceId: 'space-1',
			author: 'user@example.com',
			name: 'Create entity',
			status: 'applied' as const,
			opCount: 3,
			createdAt: '2024-01-01T10:00:00Z',
			appliedAt: '2024-01-01T10:01:00Z',
			errorMsg: null,
		},
		{
			id: 'edit-2',
			spaceId: 'space-1',
			author: 'user@example.com',
			name: 'Update property',
			status: 'pending' as const,
			opCount: 1,
			createdAt: '2024-01-02T10:00:00Z',
			appliedAt: null,
			errorMsg: null,
		},
		{
			id: 'edit-3',
			spaceId: 'space-2',
			author: 'other@example.com',
			name: 'Failed operation',
			status: 'failed' as const,
			opCount: 2,
			createdAt: '2024-01-03T10:00:00Z',
			appliedAt: null,
			errorMsg: 'Connection timeout',
		},
		{
			id: 'edit-4',
			spaceId: 'space-2',
			author: 'other@example.com',
			name: 'Processing edit',
			status: 'processing' as const,
			opCount: 5,
			createdAt: '2024-01-04T10:00:00Z',
			appliedAt: null,
			errorMsg: null,
		},
	],
}

// Mock refetch function
const mockRefetch = vi.fn()

describe('EditsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()

		// Default mock - no filter, with data
		mockUseEdits.mockReturnValue({
			edits: mockEdits,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})
	})

	describe('rendering', () => {
		it('renders edits page with heading', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Edits' })).toBeInTheDocument()
		})

		it('renders status filter dropdown', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByLabelText('Filter by status:')).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'All statuses' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Processing' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: 'Failed' })).toBeInTheDocument()
		})

		it('renders edit list with all fields', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Check column headers
			expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Space ID' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Author' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Ops' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Created' })).toBeInTheDocument()
			expect(screen.getByRole('columnheader', { name: 'Applied' })).toBeInTheDocument()
		})

		it('displays edit data in rows', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Check edit data - use getAllBy since there are multiple edits with same author
			expect(screen.getAllByText('user@example.com').length).toBeGreaterThan(0)
			expect(screen.getByText('Create entity')).toBeInTheDocument()
			expect(screen.getByText('Update property')).toBeInTheDocument()
			expect(screen.getByText('3')).toBeInTheDocument() // opCount
			expect(screen.getByText('1')).toBeInTheDocument() // opCount
		})
	})

	describe('status badges', () => {
		it('shows pending badge with correct styling', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Find badge in the table (not in dropdown) - badge has rounded-full class
			const badges = screen.getAllByText('Pending')
			const pendingBadge = badges.find((el) => el.classList.contains('rounded-full'))
			expect(pendingBadge).toBeDefined()
			expect(pendingBadge).toHaveClass('bg-amber-100', 'text-amber-800')
		})

		it('shows processing badge with correct styling', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const badges = screen.getAllByText('Processing')
			const processingBadge = badges.find((el) => el.classList.contains('rounded-full'))
			expect(processingBadge).toBeDefined()
			expect(processingBadge).toHaveClass('bg-blue-100', 'text-blue-800')
		})

		it('shows applied badge with correct styling', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const badges = screen.getAllByText('Applied')
			const appliedBadge = badges.find((el) => el.classList.contains('rounded-full'))
			expect(appliedBadge).toBeDefined()
			expect(appliedBadge).toHaveClass('bg-green-100', 'text-green-800')
		})

		it('shows failed badge with correct styling', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const badges = screen.getAllByText('Failed')
			const failedBadge = badges.find((el) => el.classList.contains('rounded-full'))
			expect(failedBadge).toBeDefined()
			expect(failedBadge).toHaveClass('bg-red-100', 'text-red-800')
		})
	})

	describe('status filter', () => {
		it('changes filter selection', async () => {
			const user = userEvent.setup()

			render(<EditsPage />, { wrapper: createWrapper() })

			const select = screen.getByLabelText('Filter by status:')
			await user.selectOptions(select, 'pending')

			expect(select).toHaveValue('pending')
		})

		it('calls hook with status filter when selected', async () => {
			render(<EditsPage />, { wrapper: createWrapper('/edits?status=pending') })

			// Hook should be called with status filter from URL
			expect(mockUseEdits).toHaveBeenCalledWith({ status: 'pending' })
		})
	})

	describe('loading state', () => {
		it('shows loading state during fetch', () => {
			mockUseEdits.mockReturnValue({
				edits: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Loading edits...')).toBeInTheDocument()
		})
	})

	describe('empty state', () => {
		it('shows empty state when no edits', () => {
			mockUseEdits.mockReturnValue({
				edits: { edits: [] },
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText('No edits found.')).toBeInTheDocument()
		})

		it('shows filtered empty state when filter is active', () => {
			mockUseEdits.mockReturnValue({
				edits: { edits: [] },
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper('/edits?status=failed') })

			expect(screen.getByText('No failed edits found.')).toBeInTheDocument()
		})
	})

	describe('error handling', () => {
		it('shows error state on API failure', () => {
			mockUseEdits.mockReturnValue({
				edits: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Failed to load edits' })).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})

		it('shows retry button on error', () => {
			mockUseEdits.mockReturnValue({
				edits: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
		})
	})

	describe('URL sync', () => {
		it('reads status filter from URL on load', () => {
			render(<EditsPage />, { wrapper: createWrapper('/edits?status=applied') })

			const select = screen.getByLabelText('Filter by status:')
			expect(select).toHaveValue('applied')
		})

		it('defaults to "All statuses" when no URL param', () => {
			render(<EditsPage />, { wrapper: createWrapper('/edits') })

			const select = screen.getByLabelText('Filter by status:')
			expect(select).toHaveValue('')
		})
	})
})
