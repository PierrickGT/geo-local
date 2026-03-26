import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'
import { EntityPage } from './entity-page'

// Mock the hooks
vi.mock('~/hooks/use-entities', () => ({
	useEntity: vi.fn(),
	usePropertyNames: vi.fn(),
}))

vi.mock('~/hooks/use-mutations', () => ({
	useDeleteEntity: vi.fn(),
	useCreateRelation: vi.fn(),
	useDeleteRelation: vi.fn(),
}))

import { useEntity, usePropertyNames } from '~/hooks/use-entities'
import { useCreateRelation, useDeleteEntity, useDeleteRelation } from '~/hooks/use-mutations'

const mockUseEntity = vi.mocked(useEntity)
const mockUsePropertyNames = vi.mocked(usePropertyNames)
const mockUseDeleteEntity = vi.mocked(useDeleteEntity)
const mockUseCreateRelation = vi.mocked(useCreateRelation)
const mockUseDeleteRelation = vi.mocked(useDeleteRelation)

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
				id: 'rel-out-1',
				fromId: 'test-entity-id',
				toId: 'related-entity-1',
				relationType: 'TYPE',
				status: 'alive' as const,
				createdAt: '2024-01-01T00:00:00Z',
			},
		],
		incoming: [
			{
				id: 'rel-in-1',
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

		// Default mock for useDeleteEntity
		mockUseDeleteEntity.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isLoading: false,
			error: null,
			reset: vi.fn(),
			data: undefined,
		})

		// Default mocks for relation mutation hooks (used by RelationsPanel)
		mockUseCreateRelation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isLoading: false,
			error: null,
			reset: vi.fn(),
			data: undefined,
		})

		mockUseDeleteRelation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isLoading: false,
			error: null,
			reset: vi.fn(),
			data: undefined,
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
								id: 'rel-type-in',
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

			// UI now uses skeleton spinners instead of text loading states
			const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
			expect(skeletons.length).toBeGreaterThan(0)
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

	describe('delete entity', () => {
		it('renders Delete button for alive entities', () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('delete-entity-button')).toBeInTheDocument()
			expect(screen.getByText('Delete')).toBeInTheDocument()
		})

		it('hides Delete button for deleted entities', () => {
			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						...mockEntityDetail.entity,
						status: 'deleted',
					},
				},
				isLoading: false,
				isError: false,
				error: null,
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.queryByTestId('delete-entity-button')).not.toBeInTheDocument()
			// Edit button should also be hidden for deleted entities
			expect(screen.queryByTestId('edit-entity-button')).not.toBeInTheDocument()
		})

		it('opens confirmation dialog when Delete button is clicked', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))

			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(
				screen.getByRole('dialog').querySelector('[data-slot="dialog-title"]'),
			).toHaveTextContent('Delete Entity')
			expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
			// "Test Entity" appears in both header and dialog — use getAllByText
			expect(screen.getAllByText('Test Entity').length).toBeGreaterThanOrEqual(2)
			expect(screen.getByText('Cancel')).toBeInTheDocument()
			expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument()
		})

		it('dialog shows entity ID when entity has no name', async () => {
			const user = userEvent.setup()
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

			await user.click(screen.getByTestId('delete-entity-button'))

			expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
			// Entity ID appears in both TruncateId (header) and dialog — use getAllByText
			expect(screen.getAllByText('test-entity-id').length).toBeGreaterThanOrEqual(2)
		})

		it('canceling dialog dismisses it without firing mutation', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn()
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))
			await user.click(screen.getByRole('button', { name: 'Cancel' }))

			expect(mutateAsyncFn).not.toHaveBeenCalled()
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		})

		it('confirm fires deleteEntity mutation with correct params', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))
			await user.click(screen.getByTestId('confirm-delete-button'))

			expect(mutateAsyncFn).toHaveBeenCalledWith({ id: 'test-entity-id' })
		})

		it('shows spinner and disables buttons during pending', async () => {
			const user = userEvent.setup()
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(), // returns a promise that never resolves — stays pending
				isLoading: true,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))

			// Both buttons should be disabled during loading
			const dialog = screen.getByRole('dialog')
			const buttons = dialog.querySelectorAll('button')
			const confirmBtn = Array.from(buttons).find((b) => b.textContent?.includes('Delete'))
			const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('Cancel'))
			expect(confirmBtn).toBeDisabled()
			expect(cancelBtn).toBeDisabled()

			// Spinner should be visible inside the confirm button
			expect(confirmBtn?.querySelector('[role="status"]')).toBeInTheDocument()
		})

		it('shows error message when mutation fails', async () => {
			const user = userEvent.setup()
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: new Error('Failed to delete entity: not found'),
				reset: vi.fn(),
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))

			expect(screen.getByTestId('delete-entity-error')).toHaveTextContent(
				'Failed to delete entity: not found',
			)
		})

		it('closing dialog resets error state', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: new Error('Some error'),
				reset: resetFn,
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))
			expect(screen.getByTestId('delete-entity-error')).toBeInTheDocument()

			// Close via Cancel
			await user.click(screen.getByRole('button', { name: 'Cancel' }))

			expect(resetFn).toHaveBeenCalled()

			// Re-open — hook mock has no error now
			mockUseDeleteEntity.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			await user.click(screen.getByTestId('delete-entity-button'))
			expect(screen.queryByTestId('delete-entity-error')).not.toBeInTheDocument()
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
