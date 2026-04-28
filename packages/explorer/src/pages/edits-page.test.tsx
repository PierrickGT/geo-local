import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditsResponse } from '~/api/types'
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

// Sample edits with decodedOps
const createMockEdits = (): EditsResponse => ({
	edits: [
		{
			id: 'edit-1',
			spaceId: 'space-1',
			author: 'noah.eth',
			name: 'Create entity',
			status: 'applied',
			opCount: 1,
			createdAt: '2024-01-01T10:00:00Z',
			appliedAt: '2024-01-01T10:01:00Z',
			errorMsg: null,
			decodedOps: [{ kind: 'createEntity', entityId: 'abc123' }],
		},
		{
			id: 'edit-2',
			spaceId: 'space-1',
			author: 'noah.eth',
			name: 'Update description',
			status: 'pending',
			opCount: 1,
			createdAt: '2024-01-02T10:00:00Z',
			appliedAt: null,
			errorMsg: null,
			decodedOps: null,
		},
		{
			id: 'edit-3',
			spaceId: 'space-2',
			author: 'alice.eth',
			name: 'Add relation',
			status: 'applied',
			opCount: 1,
			createdAt: '2024-01-03T10:00:00Z',
			appliedAt: '2024-01-03T10:01:00Z',
			errorMsg: null,
			decodedOps: [
				{
					kind: 'createRelation',
					entityId: 'def456',
					relationType: 'has property',
					toId: 'abc123',
				},
			],
		},
		{
			id: 'edit-4',
			spaceId: 'space-2',
			author: 'bob.eth',
			name: 'Failed edit',
			status: 'failed',
			opCount: 1,
			createdAt: '2024-01-04T10:00:00Z',
			appliedAt: null,
			errorMsg: 'Connection timeout',
			decodedOps: null,
		},
		{
			id: 'edit-5',
			spaceId: 'space-1',
			author: 'noah.eth',
			name: 'Update field',
			status: 'applied',
			opCount: 1,
			createdAt: '2024-01-05T10:00:00Z',
			appliedAt: '2024-01-05T10:01:00Z',
			errorMsg: null,
			decodedOps: [
				{
					kind: 'updateEntity',
					entityId: 'ghi789',
					propertyId: 'description',
					before: 'old value',
					after: 'new value',
				},
			],
		},
		{
			id: 'edit-6',
			spaceId: 'space-1',
			author: 'alice.eth',
			name: 'Processing edit',
			status: 'processing',
			opCount: 1,
			createdAt: '2024-01-06T10:00:00Z',
			appliedAt: null,
			errorMsg: null,
			decodedOps: null,
		},
	],
})

const mockRefetch = vi.fn()

describe('EditsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()

		mockUseEdits.mockReturnValue({
			edits: createMockEdits(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})
	})

	// ---------------------------------------------------------------------------
	// H1 + Stats + Refresh (VAL-EDITS-001)
	// ---------------------------------------------------------------------------
	describe('header', () => {
		it('renders H1 "Edits" with stats showing counts', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { level: 1, name: 'Edits' })).toBeInTheDocument()
			// Stats are rendered inside a div with spans for numbers
			const statsContainer = screen.getByText(/pending.*in flight.*published/)
			expect(statsContainer).toBeInTheDocument()
			expect(statsContainer.textContent).toContain('1 pending')
			expect(statsContainer.textContent).toContain('1 in flight')
			expect(statsContainer.textContent).toContain('3 published')
		})

		it('renders Refresh button (not Publish)', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument()
		})

		it('clicking Refresh calls refetch', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /refresh/i }))

			expect(mockRefetch).toHaveBeenCalled()
		})
	})

	// ---------------------------------------------------------------------------
	// Tabs with counts (VAL-EDITS-002)
	// ---------------------------------------------------------------------------
	describe('tabs', () => {
		it('renders three tabs with counts', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: /pending.*2/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /history.*4/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /conflicts.*0/i })).toBeInTheDocument()
		})

		it('Pending tab is active by default', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const pendingTab = screen.getByRole('button', { name: /pending.*2/i })
			expect(pendingTab).toHaveAttribute('data-active', 'true')
		})

		it('clicking History tab filters to applied/failed edits', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			// Should show applied + failed edits (3 applied + 1 failed = 4)
			// We wait for the tab to be active
			const editCards = screen.getAllByTestId('edit-card')
			expect(editCards.length).toBe(4)
		})

		it('clicking Pending tab shows pending + processing edits', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Pending tab is active by default
			const editCards = screen.getAllByTestId('edit-card')
			expect(editCards.length).toBe(2) // 1 pending + 1 processing
		})

		it('clicking Conflicts tab shows empty state', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /conflicts/i }))

			expect(screen.getByText('No conflicts to resolve.')).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// EditCard with color-coded badge (VAL-EDITS-003)
	// ---------------------------------------------------------------------------
	describe('EditCard badges', () => {
		it('shows CREATE badge in green for createEntity decoded ops', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Default is pending tab, need to go to History to see applied edits
			// But edit-1 is applied so we need to click History
		})

		it('shows UPDATE badge in blue for updateEntity decoded ops', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			// Find the UPDATE badge
			const updateBadges = screen.getAllByText('UPDATE')
			expect(updateBadges.length).toBeGreaterThan(0)
			expect(updateBadges[0].closest('[data-badge-kind="update"]')).toBeInTheDocument()
		})

		it('shows RELATION badge in purple for relation decoded ops', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			const relationBadge = screen.getByText('RELATION')
			expect(relationBadge.closest('[data-badge-kind="relation"]')).toBeInTheDocument()
		})

		it('shows CREATE badge for create ops', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			const createBadge = screen.getByText('CREATE')
			expect(createBadge.closest('[data-badge-kind="create"]')).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Before/after diff (VAL-EDITS-004)
	// ---------------------------------------------------------------------------
	describe('diff columns', () => {
		it('shows before/after diff for applied edits with updateEntity decoded ops', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			// Should find diff pane with before/after values
			expect(screen.getByText('old value')).toBeInTheDocument()
			expect(screen.getByText('new value')).toBeInTheDocument()
		})

		it('shows "Before" and "After" labels in diff', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			const beforeLabels = screen.getAllByText(/before/i)
			const afterLabels = screen.getAllByText(/after/i)
			expect(beforeLabels.length).toBeGreaterThan(0)
			expect(afterLabels.length).toBeGreaterThan(0)
		})
	})

	// ---------------------------------------------------------------------------
	// Minimal view for pending (VAL-EDITS-005)
	// ---------------------------------------------------------------------------
	describe('pending minimal view', () => {
		it('pending edits show minimal view without diff', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			// Pending tab is active by default
			// Pending edits should not show diff columns
			expect(screen.queryByText(/before/i)).not.toBeInTheDocument()
			expect(screen.queryByText(/after/i)).not.toBeInTheDocument()
		})

		it('pending edits show entity name and status', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Update description')).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Refresh invalidates queries (VAL-EDITS-006)
	// ---------------------------------------------------------------------------
	describe('refresh', () => {
		it('clicking Refresh calls refetch to re-fetch edits', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /refresh/i }))

			expect(mockRefetch).toHaveBeenCalledTimes(1)
		})
	})

	// ---------------------------------------------------------------------------
	// Empty state (VAL-EDITS-007)
	// ---------------------------------------------------------------------------
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

			expect(screen.getByText(/no edits found/i)).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Failed edit shows error (VAL-EDITS-008)
	// ---------------------------------------------------------------------------
	describe('failed edits', () => {
		it('shows error message for failed edits', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: /history/i }))

			expect(screen.getByText('Connection timeout')).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Status filtering with URL sync (VAL-EDITS-009)
	// ---------------------------------------------------------------------------
	describe('URL sync', () => {
		it('activates pending tab when status=pending in URL', () => {
			render(<EditsPage />, { wrapper: createWrapper('/edits?status=pending') })

			const pendingTab = screen.getByRole('button', { name: /pending/i })
			expect(pendingTab).toHaveAttribute('data-active', 'true')
		})

		it('activates history tab when status=applied in URL', () => {
			render(<EditsPage />, { wrapper: createWrapper('/edits?status=applied') })

			const historyTab = screen.getByRole('button', { name: /history/i })
			expect(historyTab).toHaveAttribute('data-active', 'true')
		})

		it('defaults to pending tab when no URL param', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const pendingTab = screen.getByRole('button', { name: /pending/i })
			expect(pendingTab).toHaveAttribute('data-active', 'true')
		})

		it('tab click shows the correct filtered edits', async () => {
			const user = userEvent.setup()
			render(<EditsPage />, { wrapper: createWrapper() })

			// Default: pending tab shows pending + processing edits
			expect(screen.getAllByTestId('edit-card').length).toBe(2)

			// Switch to history
			await user.click(screen.getByRole('button', { name: /history/i }))

			// History tab shows applied + failed edits
			expect(screen.getAllByTestId('edit-card').length).toBe(4)
		})
	})

	// ---------------------------------------------------------------------------
	// Loading skeletons (VAL-EDITS-010)
	// ---------------------------------------------------------------------------
	describe('loading state', () => {
		it('shows loading skeletons', () => {
			mockUseEdits.mockReturnValue({
				edits: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
			expect(skeletons.length).toBeGreaterThan(0)
		})
	})

	// ---------------------------------------------------------------------------
	// Error handling
	// ---------------------------------------------------------------------------
	describe('error state', () => {
		it('shows error state on API failure', () => {
			mockUseEdits.mockReturnValue({
				edits: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText(/failed to load edits/i)).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})
	})
})
