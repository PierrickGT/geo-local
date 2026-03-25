import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'
import { EntityPage } from './entity-page'

// Mock the hooks
vi.mock('~/hooks/use-entities', () => ({
	useEntity: vi.fn(),
	usePropertyNames: vi.fn(),
}))

import { useEntity, usePropertyNames } from '~/hooks/use-entities'

const mockUseEntity = vi.mocked(useEntity)
const mockUsePropertyNames = vi.mocked(usePropertyNames)

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
				propertyId: NAME_PROPERTY_ID,
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

// Mock refetch function
const mockRefetch = vi.fn()

describe('EntityPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()

		// Default mock for useEntity
		mockUseEntity.mockReturnValue({
			entity: mockEntityDetail,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})

		// Default mock for usePropertyNames - returns empty map
		mockUsePropertyNames.mockReturnValue({
			names: new Map(),
			isLoading: false,
		})
	})

	describe('rendering', () => {
		it('renders entity header with name, id, status, and timestamps', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check entity name is displayed (from NAME triple) - appears in header
			const nameElements = screen.getAllByText('Test Entity')
			expect(nameElements.length).toBeGreaterThanOrEqual(1)

			// Check entity ID is still displayed (truncated)
			expect(screen.getByText(/test-ent/)).toBeInTheDocument()

			// Check entity type badge (default "Entity" for regular entities)
			expect(screen.getByText('Entity')).toBeInTheDocument()

			// Check status badge
			expect(screen.getByText('alive')).toBeInTheDocument()

			// Check timestamps are displayed
			expect(screen.getByText(/Created:/)).toBeInTheDocument()
			expect(screen.getByText(/Updated:/)).toBeInTheDocument()
		})

		it('renders "Type" badge when entity has incoming TYPE relations', async () => {
			// Mock entity with incoming TYPE relations
			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						...mockEntityDetail.entity,
						incoming: [
							{
								fromId: 'some-entity',
								toId: 'test-entity-id',
								relationType: TYPES_PROPERTY_ID,
								status: 'alive' as const,
								createdAt: '2024-01-01T00:00:00Z',
							},
						],
					},
				},
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			// Should show "Type" badge instead of "Entity"
			expect(screen.getByText('Type')).toBeInTheDocument()
			expect(screen.queryByText('Entity')).not.toBeInTheDocument()
		})

		it('renders triples panel with properties', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check properties header
			expect(screen.getByRole('heading', { name: 'Properties' })).toBeInTheDocument()

			// Check property values (NAME triple shows "Test Entity" in both header and triples)
			expect(screen.getByText('NAME')).toBeInTheDocument()
			expect(screen.getAllByText('Test Entity').length).toBeGreaterThanOrEqual(1)
			expect(screen.getByText('DESCRIPTION')).toBeInTheDocument()
		})

		it('renders relations panel with unified list', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check relations header with count
			expect(screen.getByRole('heading', { name: /Relations.*2/ })).toBeInTheDocument()

			// Check both outgoing and incoming relation types are shown
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})
	})

	describe('loading state', () => {
		it('shows loading state during fetch', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
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
				refetch: mockRefetch,
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
				refetch: mockRefetch,
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
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
		})
	})

	describe('triples panel', () => {
		it('falls back to ID when entity has no NAME triple', () => {
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
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			// Should show truncated ID as the primary identifier
			expect(screen.getByText(/test-ent/)).toBeInTheDocument()
			// Name span should not be rendered
			expect(screen.queryByText('Test Entity')).not.toBeInTheDocument()
		})

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
				refetch: mockRefetch,
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
		it('shows all relations in unified list', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Check relations header with total count (1 outgoing + 1 incoming = 2)
			expect(screen.getByRole('heading', { name: 'Relations (2)' })).toBeInTheDocument()

			// Check outgoing relation type is shown
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			// Check incoming relation type is shown
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})

		it('shows empty state when no relations', async () => {
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
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('No relations found for this entity.')).toBeInTheDocument()
		})
	})
})
