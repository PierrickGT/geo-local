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

// Mock usePropertyNames to return empty map
vi.mock('~/hooks/use-entities', () => ({
	usePropertyNames: () => ({ names: new Map(), isLoading: false }),
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
		it('renders H1 "Edits" with published count', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { level: 1, name: 'Edits' })).toBeInTheDocument()
			const statsContainer = screen.getByText(/published/)
			expect(statsContainer).toBeInTheDocument()
			expect(statsContainer.textContent).toContain('4 published')
		})
	})

	// ---------------------------------------------------------------------------
	// History tab shows applied/failed edits
	// ---------------------------------------------------------------------------
	describe('history view', () => {
		it('shows applied and failed edits', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const editCards = screen.getAllByTestId('edit-card')
			expect(editCards.length).toBe(4) // 3 applied + 1 failed
		})
	})

	// ---------------------------------------------------------------------------
	// EditCard with color-coded badge (VAL-EDITS-003)
	// ---------------------------------------------------------------------------
	describe('EditCard badges', () => {
		it('shows UPDATE badge in blue for updateEntity decoded ops', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const updateBadges = screen.getAllByText('UPDATE')
			expect(updateBadges.length).toBeGreaterThan(0)
			expect(updateBadges[0].closest('[data-badge-kind="update"]')).toBeInTheDocument()
		})

		it('shows RELATION badge in purple for relation decoded ops', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const relationBadge = screen.getByText('RELATION')
			expect(relationBadge.closest('[data-badge-kind="relation"]')).toBeInTheDocument()
		})

		it('shows CREATE badge for create ops', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const createBadge = screen.getByText('CREATE')
			expect(createBadge.closest('[data-badge-kind="create"]')).toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Before/after diff (VAL-EDITS-004)
	// ---------------------------------------------------------------------------
	describe('diff columns', () => {
		it('shows before/after diff for applied edits with updateEntity decoded ops', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText('old value')).toBeInTheDocument()
			expect(screen.getByText('new value')).toBeInTheDocument()
		})

		it('shows "Before" and "After" labels in diff', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			const beforeLabels = screen.getAllByText(/before/i)
			const afterLabels = screen.getAllByText(/after/i)
			expect(beforeLabels.length).toBeGreaterThan(0)
			expect(afterLabels.length).toBeGreaterThan(0)
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
		it('shows error message for failed edits', () => {
			render(<EditsPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Connection timeout')).toBeInTheDocument()
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
