import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityPage } from './entity-page'

// Mock the hooks
vi.mock('~/hooks/use-entities', () => ({
	useEntity: vi.fn(),
}))

import { useEntity } from '~/hooks/use-entities'

const mockUseEntity = vi.mocked(useEntity)

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/entities/test-entity-id') {
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

// Sample entity detail data
const mockEntityDetail = {
	entity: {
		id: 'test-entity-id',
		status: 'alive' as const,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
		triples: [
			{
				entityId: 'test-entity-id',
				propertyId: 'NAME',
				valueType: 'text' as const,
				value: { value: 'Test Entity' },
				language: null,
			},
			{
				entityId: 'test-entity-id',
				propertyId: 'DESCRIPTION',
				valueType: 'text' as const,
				value: { value: 'A test entity description' },
				language: null,
			},
			{
				entityId: 'test-entity-id',
				propertyId: 'some-long-property-id',
				valueType: 'number' as const,
				value: { value: 42 },
				language: null,
			},
		],
		outgoing: [
			{
				fromId: 'test-entity-id',
				toId: 'related-entity-1',
				relationType: 'TYPE',
				status: 'alive' as const,
				createdAt: '2024-01-01T00:00:00Z',
			},
		],
		incoming: [
			{
				fromId: 'related-entity-2',
				toId: 'test-entity-id',
				relationType: 'REFERENCES',
				status: 'alive' as const,
				createdAt: '2024-01-01T00:00:00Z',
			},
		],
	},
}

describe('EntityPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// Default mock
		mockUseEntity.mockReturnValue({
			entity: mockEntityDetail,
			isLoading: false,
			isError: false,
			error: null,
		})
	})

	describe('rendering', () => {
		it('renders entity header with id, status, and timestamps', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check entity ID is displayed (truncated)
			expect(screen.getByText(/test-ent/)).toBeInTheDocument()

			// Check status badge
			expect(screen.getByText('alive')).toBeInTheDocument()

			// Check timestamps are displayed
			expect(screen.getByText(/Created:/)).toBeInTheDocument()
			expect(screen.getByText(/Updated:/)).toBeInTheDocument()
		})

		it('renders triples panel with properties', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check properties header
			expect(screen.getByRole('heading', { name: 'Properties' })).toBeInTheDocument()

			// Check property values
			expect(screen.getByText('NAME')).toBeInTheDocument()
			expect(screen.getByText('Test Entity')).toBeInTheDocument()
			expect(screen.getByText('DESCRIPTION')).toBeInTheDocument()
		})

		it('renders relations panel with tabs', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check tabs exist
			expect(screen.getByRole('button', { name: /Outgoing/ })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Incoming/ })).toBeInTheDocument()
		})
	})

	describe('loading state', () => {
		it('shows loading state during fetch', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: true,
				isError: false,
				error: null,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Loading entity...')).toBeInTheDocument()
		})
	})

	describe('error handling', () => {
		it('shows 404 not found for nonexistent entity', () => {
			const notFoundError = new Error('Not found') as Error & { status: number }
			notFoundError.status = 404

			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: false,
				isError: true,
				error: notFoundError,
			})

			render(<EntityPage />, { wrapper: createWrapper('/entities/nonexistent-id') })

			// Use getByRole to target the heading specifically (not SVG title)
			expect(screen.getByRole('heading', { name: 'Entity not found' })).toBeInTheDocument()
			// The ID is displayed but may be split across elements
			expect(screen.getByText(/does not exist/)).toBeInTheDocument()
		})

		it('shows error state on API failure', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Failed to load entity')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})

		it('shows retry button on error', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
		})
	})

	describe('triples panel', () => {
		it('shows empty state when no triples', () => {
			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						...mockEntityDetail.entity,
						triples: [],
					},
				},
				isLoading: false,
				isError: false,
				error: null,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('No properties found for this entity.')).toBeInTheDocument()
		})

		it('displays value type badges', () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Multiple 'text' badges exist due to two text triples in mock data
			expect(screen.getAllByText('text').length).toBeGreaterThan(0)
			expect(screen.getByText('number')).toBeInTheDocument()
		})
	})

	describe('relations panel', () => {
		it('switches between outgoing and incoming tabs', async () => {
			const user = userEvent.setup()

			render(<EntityPage />, { wrapper: createWrapper() })

			// Check outgoing tab is active by default
			expect(screen.getByRole('button', { name: /Outgoing \(1\)/ })).toBeInTheDocument()

			// Click incoming tab
			await user.click(screen.getByRole('button', { name: /Incoming \(1\)/ }))

			// Check incoming relation type is shown
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})

		it('shows empty state when no relations', async () => {
			const user = userEvent.setup()

			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						...mockEntityDetail.entity,
						outgoing: [],
						incoming: [],
					},
				},
				isLoading: false,
				isError: false,
				error: null,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('No outgoing relations found.')).toBeInTheDocument()

			// Switch to incoming tab
			await user.click(screen.getByRole('button', { name: /Incoming \(0\)/ }))

			expect(screen.getByText('No incoming relations found.')).toBeInTheDocument()
		})
	})
})
