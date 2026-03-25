import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Relation } from '~/api/types'
import { RelationsPanel } from './relations-panel'

// Mock the usePropertyNames hook
vi.mock('~/hooks/use-entities', () => ({
	usePropertyNames: vi.fn(),
}))

import { usePropertyNames } from '~/hooks/use-entities'

const mockUsePropertyNames = vi.mocked(usePropertyNames)

// Default mock that returns empty map (no names resolved)
const defaultNamesMap = new Map<string, string | undefined>()

beforeEach(() => {
	vi.clearAllMocks()
	mockUsePropertyNames.mockReturnValue({
		names: defaultNamesMap,
		isLoading: false,
	})
})

/**
 * Helper to configure the usePropertyNames mock for both calls:
 * first call resolves relation type names, second resolves linked entity names.
 */
function mockPropertyNames(
	relationNames: Map<string, string | undefined>,
	entityNames: Map<string, string | undefined>,
) {
	mockUsePropertyNames
		.mockReturnValueOnce({ names: relationNames, isLoading: false })
		.mockReturnValueOnce({ names: entityNames, isLoading: false })
}

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/entities/test-entity') {
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

describe('RelationsPanel', () => {
	const mockOutgoing: Relation[] = [
		{
			id: 'rel-outgoing-1',
			fromId: 'test-entity',
			toId: 'type-entity',
			relationType: 'TYPE',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
		{
			id: 'rel-outgoing-2',
			fromId: 'test-entity',
			toId: 'related-entity-1',
			relationType: 'REFERENCES',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
	]

	const mockIncoming: Relation[] = [
		{
			id: 'rel-incoming-1',
			fromId: 'source-entity',
			toId: 'test-entity',
			relationType: 'LINKS_TO',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
	]

	describe('rendering', () => {
		it('renders unified header with total count', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByRole('heading', { name: /Relations.*3/ })).toBeInTheDocument()
		})

		it('shows all relations in a single list', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Outgoing relations
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
			// Incoming relation
			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()
		})

		it('displays count as 0 when no relations', () => {
			render(<RelationsPanel outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByRole('heading', { name: 'Relations (0)' })).toBeInTheDocument()
		})
	})

	describe('entity navigation', () => {
		it('displays outgoing linked entity IDs (toId) as clickable', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Outgoing shows toId
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
			expect(screen.getByText(/related/)).toBeInTheDocument()
		})

		it('displays incoming source entities (fromId) as clickable', () => {
			render(<RelationsPanel outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Incoming shows fromId
			expect(screen.getByText(/source-e/)).toBeInTheDocument()
		})

		it('shows both outgoing and incoming entities when both exist', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Outgoing toId values
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
			expect(screen.getByText(/related/)).toBeInTheDocument()
			// Incoming fromId value
			expect(screen.getByText(/source-e/)).toBeInTheDocument()
		})
	})

	describe('direction indicators', () => {
		it('shows right arrow for outgoing relations', () => {
			// Use single relation to test direction indicator
			const singleOutgoing = [mockOutgoing[0]]
			render(<RelationsPanel outgoing={singleOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Check for direction indicator SVG
			const arrow = screen.getByRole('img', { name: 'points to' })
			expect(arrow).toBeInTheDocument()
		})

		it('shows left arrow for incoming relations', () => {
			render(<RelationsPanel outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Check for direction indicator SVG (rotated for incoming)
			const arrow = screen.getByRole('img', { name: 'pointed from' })
			expect(arrow).toBeInTheDocument()
		})

		it('shows both direction indicators when both exist', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Use getAllByRole since there are multiple outgoing relations
			expect(screen.getAllByRole('img', { name: 'points to' }).length).toBeGreaterThan(0)
			expect(screen.getByRole('img', { name: 'pointed from' })).toBeInTheDocument()
		})
	})

	describe('empty states', () => {
		it('shows empty state when no relations at all', () => {
			render(<RelationsPanel outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByText('No relations found for this entity.')).toBeInTheDocument()
		})

		it('shows empty state when only outgoing is empty', () => {
			render(<RelationsPanel outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Should show incoming relation, not empty state
			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()
		})

		it('shows empty state when only incoming is empty', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should show outgoing relations, not empty state
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})
	})

	describe('truncation', () => {
		it('truncates long relation types', () => {
			const longTypeRelation: Relation = {
				id: 'rel-long-type',
				fromId: 'test-entity',
				toId: 'target',
				relationType: 'THIS_IS_A_VERY_LONG_RELATION_TYPE_THAT_SHOULD_BE_TRUNCATED',
				status: 'alive',
				createdAt: '2024-01-01T00:00:00Z',
			}

			render(<RelationsPanel outgoing={[longTypeRelation]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Relation type should be truncated with ellipsis
			const truncatedText = screen.getByTitle(longTypeRelation.relationType)
			expect(truncatedText).toBeInTheDocument()
			expect(truncatedText.textContent).toContain('...')
		})
	})

	describe('property name resolution', () => {
		it('displays resolved name when available', () => {
			const relationNames = new Map<string, string | undefined>()
			relationNames.set('property-id-123', 'Has Part')

			mockPropertyNames(relationNames, new Map())

			const relationWithId: Relation = {
				id: 'rel-resolved-name',
				fromId: 'test-entity',
				toId: 'target',
				relationType: 'property-id-123',
				status: 'alive',
				createdAt: '2024-01-01T00:00:00Z',
			}

			render(<RelationsPanel outgoing={[relationWithId]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display the resolved name
			expect(screen.getByText('Has Part')).toBeInTheDocument()
			// Title should still show the full ID
			expect(screen.getByTitle('property-id-123')).toBeInTheDocument()
		})

		it('falls back to formatted ID when no name resolved', () => {
			mockPropertyNames(new Map(), new Map())

			const relationWithId: Relation = {
				id: 'rel-fallback-id',
				fromId: 'test-entity',
				toId: 'target',
				relationType: 'property-id-456',
				status: 'alive',
				createdAt: '2024-01-01T00:00:00Z',
			}

			render(<RelationsPanel outgoing={[relationWithId]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display truncated ID (formatPropertyId)
			expect(screen.getByText(/property-i/)).toBeInTheDocument()
		})

		it('shows well-known properties directly when no name resolved', () => {
			mockPropertyNames(new Map(), new Map())

			render(<RelationsPanel outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Well-known properties like TYPE are shown as-is
			expect(screen.getByText('TYPE')).toBeInTheDocument()
		})

		it('prefers resolved name over well-known property format', () => {
			const relationNames = new Map<string, string | undefined>()
			relationNames.set('TYPE', 'Is Type Of')

			mockPropertyNames(relationNames, new Map())

			render(<RelationsPanel outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display the resolved name even for well-known property
			expect(screen.getByText('Is Type Of')).toBeInTheDocument()
		})
	})

	describe('linked entity name resolution', () => {
		it('displays linked entity name when available', () => {
			const entityNames = new Map<string, string | undefined>()
			entityNames.set('type-entity', 'Location Type')

			mockPropertyNames(new Map(), entityNames)

			render(<RelationsPanel outgoing={[mockOutgoing[0]]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display the linked entity's resolved name
			expect(screen.getByText('Location Type')).toBeInTheDocument()
			// Title should still show the full entity ID
			expect(screen.getByTitle('type-entity')).toBeInTheDocument()
		})

		it('falls back to truncated ID when linked entity has no name', () => {
			mockPropertyNames(new Map(), new Map())

			render(<RelationsPanel outgoing={[mockOutgoing[0]]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display truncated entity ID
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
		})
	})
})
