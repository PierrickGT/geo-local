import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GraphPage } from './graph-page'

// Mock the hooks
vi.mock('~/hooks/use-entities', () => ({
	useEntities: vi.fn(),
	useEntity: vi.fn(),
	useEntityRelations: vi.fn(),
}))

vi.mock('~/api/entities', () => ({
	getEntity: vi.fn(() => Promise.resolve({ entity: null })),
	getEntityRelations: vi.fn(() => Promise.resolve({ relations: [] })),
}))

// Mock react-router's useNavigate (but NOT useSearchParams - let MemoryRouter provide it)
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router')
	return {
		...actual,
		useNavigate: () => mockNavigate,
	}
})

import { useEntities, useEntity, useEntityRelations } from '~/hooks/use-entities'

const mockUseEntities = vi.mocked(useEntities)
const mockUseEntity = vi.mocked(useEntity)
const mockUseEntityRelations = vi.mocked(useEntityRelations)

// Helper to create wrapper with all providers
function createWrapper(initialRoute = '/graph') {
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
		{
			id: 'entity-3',
			status: 'alive' as const,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
	],
	total: 3,
	limit: 50,
	offset: 0,
}

const mockEntityDetail = {
	entity: {
		id: 'focus-entity',
		status: 'alive' as const,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
		triples: [],
		outgoing: [],
		incoming: [],
	},
}

const mockRelations = {
	relations: [
		{
			id: 'rel-graph-1',
			fromId: 'focus-entity',
			toId: 'neighbor-1',
			relationType: 'RELATES_TO',
			status: 'alive' as const,
			createdAt: '2024-01-01T00:00:00Z',
		},
		{
			id: 'rel-graph-2',
			fromId: 'neighbor-2',
			toId: 'focus-entity',
			relationType: 'RELATED_FROM',
			status: 'alive' as const,
			createdAt: '2024-01-01T00:00:00Z',
		},
	],
}

// Mock refetch function
const mockRefetch = vi.fn()

describe('GraphPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()
		mockNavigate.mockClear()

		// Default mocks for seed mode
		mockUseEntities.mockReturnValue({
			entities: mockEntities,
			total: 3,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})

		mockUseEntity.mockReturnValue({
			entity: undefined,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})

		mockUseEntityRelations.mockReturnValue({
			relations: undefined,
			isLoading: false,
			isError: false,
			error: null,
			refetch: mockRefetch,
		})
	})

	describe('loading state', () => {
		it('shows loading state in seed mode', () => {
			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<GraphPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Loading graph data...')).toBeInTheDocument()
		})

		it('shows loading state in focus mode', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: true,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			// Pass URL with focus param to MemoryRouter
			render(<GraphPage />, { wrapper: createWrapper('/graph?focus=test-id') })

			expect(screen.getByText('Loading graph data...')).toBeInTheDocument()
		})
	})

	describe('error state', () => {
		it('shows error state on API failure in seed mode', () => {
			mockUseEntities.mockReturnValue({
				entities: undefined,
				total: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Network error'),
				refetch: mockRefetch,
			})

			render(<GraphPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Failed to load graph data')).toBeInTheDocument()
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

			render(<GraphPage />, { wrapper: createWrapper() })

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

			render(<GraphPage />, { wrapper: createWrapper() })

			await user.click(screen.getByRole('button', { name: 'Retry' }))

			expect(mockRefetch).toHaveBeenCalledTimes(1)
		})

		it('shows error for invalid focus entity', () => {
			mockUseEntity.mockReturnValue({
				entity: undefined,
				isLoading: false,
				isError: true,
				error: new Error('Entity not found'),
				refetch: mockRefetch,
			})

			// Pass URL with focus param to MemoryRouter
			render(<GraphPage />, { wrapper: createWrapper('/graph?focus=invalid-id') })

			expect(screen.getByText(/not found/)).toBeInTheDocument()
		})
	})

	describe('empty state', () => {
		it('shows empty state when no entities exist', () => {
			mockUseEntities.mockReturnValue({
				entities: {
					entities: [],
					total: 0,
					limit: 50,
					offset: 0,
				},
				total: 0,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<GraphPage />, { wrapper: createWrapper() })

			expect(screen.getByText(/No entities to display/)).toBeInTheDocument()
		})
	})

	describe('seed mode rendering', () => {
		it('renders graph with seed entities', async () => {
			render(<GraphPage />, { wrapper: createWrapper() })

			// Should show the graph panel with node count
			await waitFor(() => {
				expect(screen.getByText(/Graph \(/)).toBeInTheDocument()
			})

			// Should show help text
			expect(screen.getByText(/Click: view entity/)).toBeInTheDocument()
		})
	})

	describe('focus mode rendering', () => {
		it('renders graph with focused entity and neighbors', async () => {
			mockUseEntity.mockReturnValue({
				entity: mockEntityDetail,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			mockUseEntityRelations.mockReturnValue({
				relations: mockRelations,
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			// Pass URL with focus param to MemoryRouter
			render(<GraphPage />, { wrapper: createWrapper('/graph?focus=focus-entity') })

			// Should show the graph panel
			await waitFor(() => {
				expect(screen.getByText(/Graph \(/)).toBeInTheDocument()
			})
		})
	})

	describe('node interactions', () => {
		it('graph panel shows interaction hints', async () => {
			render(<GraphPage />, { wrapper: createWrapper() })

			await waitFor(() => {
				expect(
					screen.getByText(/Click: view entity \| Double-click: expand \| Drag: pin/),
				).toBeInTheDocument()
			})
		})
	})

	describe('focus parameter handling', () => {
		it('handles focus parameter in URL', async () => {
			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						id: 'test-focus-id',
						status: 'alive' as const,
						createdAt: '2024-01-01T00:00:00Z',
						updatedAt: '2024-01-02T00:00:00Z',
						triples: [],
						outgoing: [],
						incoming: [],
					},
				},
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			mockUseEntityRelations.mockReturnValue({
				relations: { relations: [] },
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			// Pass URL with focus param to MemoryRouter
			render(<GraphPage />, { wrapper: createWrapper('/graph?focus=test-focus-id') })

			// useEntity should be called with the focus ID
			expect(mockUseEntity).toHaveBeenCalledWith('test-focus-id')
		})
	})
})
