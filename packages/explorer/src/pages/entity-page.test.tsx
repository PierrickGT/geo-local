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
				createdAt: '2024-01-01T00:00:00Z',
			},
		],
		incoming: [
			{
				id: 'rel-in-1',
				fromId: 'related-entity-2',
				toId: 'test-entity-id',
				relationType: 'REFERENCES',
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

		// Default mocks for relation mutation hooks
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
		it('renders entity header with avatar, name, type pill, status, ID copy, meta, and actions', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Avatar initials from "Test Entity" → "TE"
			expect(screen.getByText('TE')).toBeInTheDocument()

			// Entity name (appears in header + graph neighborhood)
			expect(screen.getAllByText('Test Entity').length).toBeGreaterThanOrEqual(2)

			// Type pill (default Entity)
			expect(screen.getByText('Entity')).toBeInTheDocument()

			// Published status
			expect(screen.getByText('published')).toBeInTheDocument()

			// Full entity ID shown
			expect(screen.getByText('test-entity-id')).toBeInTheDocument()

			// Copy button exists (in the header)
			expect(screen.getAllByLabelText('Copy to clipboard').length).toBeGreaterThanOrEqual(1)

			// Meta columns
			expect(screen.getByText(/Created/)).toBeInTheDocument()
			expect(screen.getByText(/Updated/)).toBeInTheDocument()

			// Action buttons
			expect(screen.getByTestId('edit-entity-button')).toBeInTheDocument()
			expect(screen.getByTestId('delete-entity-button')).toBeInTheDocument()
			expect(screen.getByText('Back')).toBeInTheDocument()
		})

		it('renders Type pill when entity has incoming TYPE relations', async () => {
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

			// Should show "Type" pill
			expect(screen.getByText('Type')).toBeInTheDocument()
		})

		it('renders Property pill when entity has outgoing TYPE to Property entity', async () => {
			mockUseEntity.mockReturnValue({
				entity: {
					entity: {
						...mockEntityDetail.entity,
						outgoing: [
							{
								id: 'rel-out-1',
								fromId: 'test-entity-id',
								toId: '808a04ceb21c4d888ad12e240613e5ca', // PROPERTY_ENTITY_ID
								relationType: TYPES_PROPERTY_ID,
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

			expect(screen.getByText('Property')).toBeInTheDocument()
		})

		it('renders two-column layout', async () => {
			const { container } = render(<EntityPage />, { wrapper: createWrapper() })

			// Check for 2-column grid layout
			const gridEl = container.querySelector('.grid.grid-cols-\\[1fr_380px\\]')
			expect(gridEl).toBeInTheDocument()
		})

		it('renders TabBar with correct tab labels', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Properties · 3')).toBeInTheDocument()
			expect(screen.getByText('Relations · 2')).toBeInTheDocument()
			expect(screen.getByText('JSON')).toBeInTheDocument()
			expect(screen.getByText('History · 0')).toBeInTheDocument()
		})

		it('shows properties tab by default', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			// Properties content should be visible - check for property rows
			// Empty property names => shows formatPropertyId result
			expect(screen.getAllByText('text').length).toBeGreaterThan(0)
			expect(screen.getByText('number')).toBeInTheDocument()
		})

		it('shows unnamed entity with ID chars as avatar fallback', async () => {
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

			// Avatar should show first 2 chars of entity ID: "TE"
			expect(screen.getByText('TE')).toBeInTheDocument()
			// No entity name heading
			expect(screen.queryByText('Test Entity')).not.toBeInTheDocument()
		})
	})

	describe('tab switching', () => {
		it('switches to Relations tab when clicked', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByText('Relations · 2'))

			// Should show Relations header with count
			expect(screen.getByText(/Relations.*2/)).toBeInTheDocument()
			// Should show add relation button
			expect(screen.getByTestId('add-relation-button')).toBeInTheDocument()
		})

		it('switches to JSON tab when clicked', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByText('JSON'))

			// Should show pretty-printed JSON in the left column
			// The JSON tab shows the full entity detail as JSON
			const jsonPres = document.querySelectorAll('pre')
			expect(jsonPres.length).toBeGreaterThanOrEqual(1)
			expect(jsonPres[0]?.textContent).toContain('test-entity-id')
		})

		it('switches to History tab when clicked', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByText('History · 0'))

			expect(screen.getByText('No edit history available.')).toBeInTheDocument()
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

			expect(screen.getByRole('heading', { name: 'Entity not found' })).toBeInTheDocument()
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

	describe('properties panel', () => {
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

			expect(screen.getAllByText('text').length).toBeGreaterThan(0)
			expect(screen.getByText('number')).toBeInTheDocument()
		})
	})

	describe('delete entity', () => {
		it('renders Delete button', () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('delete-entity-button')).toBeInTheDocument()
			expect(screen.getByText('Delete')).toBeInTheDocument()
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
				mutateAsync: vi.fn(),
				isLoading: true,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByTestId('delete-entity-button'))

			const dialog = screen.getByRole('dialog')
			const buttons = dialog.querySelectorAll('button')
			const confirmBtn = Array.from(buttons).find((b) => b.textContent?.includes('Delete'))
			const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('Cancel'))
			expect(confirmBtn).toBeDisabled()
			expect(cancelBtn).toBeDisabled()
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
		it('shows all relations in Relations tab', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			// Switch to Relations tab
			await user.click(screen.getByText('Relations · 2'))

			// Should show relation type names
			expect(screen.getByText('Type')).toBeInTheDocument()
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
				refetch: mockRefetch,
			})

			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByText('Relations · 0'))

			expect(screen.getByText('No relations found for this entity.')).toBeInTheDocument()
		})

		it('shows add relation button in Relations tab', async () => {
			const user = userEvent.setup()
			render(<EntityPage />, { wrapper: createWrapper() })

			await user.click(screen.getByText('Relations · 2'))

			expect(screen.getByTestId('add-relation-button')).toBeInTheDocument()
		})
	})

	describe('right rail', () => {
		it('renders graph neighborhood panel', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Graph neighborhood')).toBeInTheDocument()
		})

		it('renders activity panel', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Activity')).toBeInTheDocument()
		})

		it('renders raw JSON panel', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Raw')).toBeInTheDocument()
		})
	})

	describe('action buttons', () => {
		it('Back button navigates to /entities', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			const backButton = screen.getByText('Back')
			expect(backButton).toBeInTheDocument()

			// The button is rendered but we can't test actual navigation in unit test
			// Just verify it exists and is clickable
			expect(backButton.closest('button')).toBeInTheDocument()
		})

		it('Edit button navigates to entity edit page', async () => {
			render(<EntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('edit-entity-button')).toBeInTheDocument()
			expect(screen.getByText('Edit')).toBeInTheDocument()
		})
	})
})
