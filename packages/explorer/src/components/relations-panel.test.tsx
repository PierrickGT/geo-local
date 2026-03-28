import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Relation } from '~/api/types'
import { RelationsPanel } from './relations-panel'

// Mock the usePropertyNames hook
vi.mock('~/hooks/use-entities', () => ({
	usePropertyNames: vi.fn(),
}))

// Mock the mutation hooks
vi.mock('~/hooks/use-mutations', () => ({
	useCreateRelation: vi.fn(),
	useDeleteRelation: vi.fn(),
}))

import { usePropertyNames } from '~/hooks/use-entities'
import { useCreateRelation, useDeleteRelation } from '~/hooks/use-mutations'

const mockUsePropertyNames = vi.mocked(usePropertyNames)
const mockUseCreateRelation = vi.mocked(useCreateRelation)
const mockUseDeleteRelation = vi.mocked(useDeleteRelation)

// Default mock that returns empty map (no names resolved)
const defaultNamesMap = new Map<string, string | undefined>()

beforeEach(() => {
	vi.clearAllMocks()
	mockUsePropertyNames.mockReturnValue({
		names: defaultNamesMap,
		isLoading: false,
	})

	// Default mutation hook mocks
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

	const entityId = 'test-entity'

	describe('rendering', () => {
		it('renders unified header with total count', () => {
			render(
				<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={mockIncoming} />,
				{
					wrapper: createWrapper(),
				},
			)

			expect(screen.getByRole('heading', { name: /Relations.*3/ })).toBeInTheDocument()
		})

		it('shows all relations in a single list', () => {
			render(
				<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={mockIncoming} />,
				{
					wrapper: createWrapper(),
				},
			)

			// Outgoing relations
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
			// Incoming relation
			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()
		})

		it('displays count as 0 when no relations', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByRole('heading', { name: 'Relations (0)' })).toBeInTheDocument()
		})
	})

	describe('entity navigation', () => {
		it('displays outgoing linked entity IDs (toId) as clickable', () => {
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Outgoing shows toId
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
			expect(screen.getByText(/related/)).toBeInTheDocument()
		})

		it('displays incoming source entities (fromId) as clickable', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Incoming shows fromId
			expect(screen.getByText(/source-e/)).toBeInTheDocument()
		})

		it('shows both outgoing and incoming entities when both exist', () => {
			render(
				<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={mockIncoming} />,
				{
					wrapper: createWrapper(),
				},
			)

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
			render(<RelationsPanel entityId={entityId} outgoing={singleOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Check for direction indicator SVG
			const arrow = screen.getByRole('img', { name: 'points to' })
			expect(arrow).toBeInTheDocument()
		})

		it('shows left arrow for incoming relations', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Check for direction indicator SVG (rotated for incoming)
			const arrow = screen.getByRole('img', { name: 'pointed from' })
			expect(arrow).toBeInTheDocument()
		})

		it('shows both direction indicators when both exist', () => {
			render(
				<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={mockIncoming} />,
				{
					wrapper: createWrapper(),
				},
			)

			// Use getAllByRole since there are multiple outgoing relations
			expect(screen.getAllByRole('img', { name: 'points to' }).length).toBeGreaterThan(0)
			expect(screen.getByRole('img', { name: 'pointed from' })).toBeInTheDocument()
		})
	})

	describe('empty states', () => {
		it('shows empty state when no relations at all', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByText('No relations found for this entity.')).toBeInTheDocument()
		})

		it('shows empty state when only outgoing is empty', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Should show incoming relation, not empty state
			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()
		})

		it('shows empty state when only incoming is empty', () => {
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should show outgoing relations, not empty state
			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})
	})

	describe('truncation', () => {
		it('displays long relation types in full', () => {
			const longTypeRelation: Relation = {
				id: 'rel-long-type',
				fromId: 'test-entity',
				toId: 'target',
				relationType: 'THIS_IS_A_VERY_LONG_RELATION_TYPE_THAT_SHOULD_BE_TRUNCATED',
				status: 'alive',
				createdAt: '2024-01-01T00:00:00Z',
			}

			render(<RelationsPanel entityId={entityId} outgoing={[longTypeRelation]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Relation type is displayed in full (truncation removed)
			const truncatedText = screen.getByTitle(longTypeRelation.relationType)
			expect(truncatedText).toBeInTheDocument()
			expect(truncatedText.textContent).toBe(longTypeRelation.relationType)
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

			render(<RelationsPanel entityId={entityId} outgoing={[relationWithId]} incoming={[]} />, {
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

			render(<RelationsPanel entityId={entityId} outgoing={[relationWithId]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display truncated ID (formatPropertyId)
			expect(screen.getByText(/property-i/)).toBeInTheDocument()
		})

		it('shows well-known properties directly when no name resolved', () => {
			mockPropertyNames(new Map(), new Map())

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Well-known properties like TYPE are shown as-is
			expect(screen.getByText('TYPE')).toBeInTheDocument()
		})

		it('prefers resolved name over well-known property format', () => {
			const relationNames = new Map<string, string | undefined>()
			relationNames.set('TYPE', 'Is Type Of')

			mockPropertyNames(relationNames, new Map())

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
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

			render(<RelationsPanel entityId={entityId} outgoing={[mockOutgoing[0]]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display the linked entity's resolved name
			expect(screen.getByText('Location Type')).toBeInTheDocument()
			// Title should still show the full entity ID
			expect(screen.getByTitle('type-entity')).toBeInTheDocument()
		})

		it('falls back to truncated ID when linked entity has no name', () => {
			mockPropertyNames(new Map(), new Map())

			render(<RelationsPanel entityId={entityId} outgoing={[mockOutgoing[0]]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Should display truncated entity ID
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
		})
	})

	describe('Add Relation', () => {
		it('renders Add Relation button in panel header', () => {
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByTestId('add-relation-button')).toBeInTheDocument()
			expect(screen.getByText('Add Relation')).toBeInTheDocument()
		})

		it('opens Add Relation dialog when button is clicked', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			expect(screen.getByRole('dialog')).toBeInTheDocument()
			// Dialog title (within dialog)
			expect(
				screen.getByRole('dialog').querySelector('[data-slot="dialog-title"]'),
			).toHaveTextContent('Add Relation')
			expect(screen.getByLabelText('Relation Type (Property ID)')).toBeInTheDocument()
			expect(screen.getByLabelText('Target Entity ID')).toBeInTheDocument()
		})

		it('dialog has relation type and target entity ID inputs', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			const typeInput = screen.getByLabelText('Relation Type (Property ID)')
			const targetInput = screen.getByLabelText('Target Entity ID')
			expect(typeInput).toBeInTheDocument()
			expect(targetInput).toBeInTheDocument()
		})

		it('dialog shows current entity as implicit source', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			// Dialog should describe the outgoing relation creation
			expect(
				screen.getByText(/Create a new outgoing relation from this entity/),
			).toBeInTheDocument()
		})

		it('blocks submission when fields are empty', async () => {
			const user = userEvent.setup()
			const mutateFn = vi.fn()
			mockUseCreateRelation.mockReturnValue({
				mutate: mutateFn,
				mutateAsync: vi.fn(),
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			// Find the submit button in the dialog (should be disabled)
			const submitButton = screen.getByRole('button', { name: 'Add Relation' })
			expect(submitButton).toBeDisabled()

			// Fill only one field
			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'SOME_TYPE')
			expect(submitButton).toBeDisabled()

			// Clear and fill other field
			await user.clear(screen.getByLabelText('Relation Type (Property ID)'))
			await user.type(screen.getByLabelText('Target Entity ID'), 'target-id')
			expect(submitButton).toBeDisabled()

			// No mutation should have been called
			expect(mutateFn).not.toHaveBeenCalled()
		})

		it('enables submit when both fields are filled', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'REFERENCES')
			await user.type(screen.getByLabelText('Target Entity ID'), 'target-entity-id')

			const submitButton = screen.getByRole('button', { name: 'Add Relation' })
			expect(submitButton).not.toBeDisabled()
		})

		it('submits createRelation mutation with correct params on submit', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'REFERENCES')
			await user.type(screen.getByLabelText('Target Entity ID'), 'target-entity-id')

			await user.click(screen.getByRole('button', { name: 'Add Relation' }))

			expect(mutateAsyncFn).toHaveBeenCalledWith({
				fromEntity: entityId,
				toEntity: 'target-entity-id',
				type: 'REFERENCES',
			})
		})

		it('closes dialog and resets form on successful add', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: resetFn,
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))
			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'REFERENCES')
			await user.type(screen.getByLabelText('Target Entity ID'), 'target-entity-id')
			await user.click(screen.getByRole('button', { name: 'Add Relation' }))

			// Dialog should be closed after success
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(resetFn).toHaveBeenCalled()
		})

		it('shows error in dialog when mutation fails', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockRejectedValue(new Error('Target entity not found'))
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))
			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'REFERENCES')
			await user.type(screen.getByLabelText('Target Entity ID'), 'bad-entity')

			await user.click(screen.getByRole('button', { name: 'Add Relation' }))

			// Dialog should still be open (mutation threw error)
			expect(screen.getByRole('dialog')).toBeInTheDocument()
		})

		it('shows error message when hook has error', async () => {
			const user = userEvent.setup()
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: new Error('Ingest server error'),
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))

			expect(screen.getByTestId('add-relation-error')).toHaveTextContent('Ingest server error')
		})

		it('closing dialog resets form and error state', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: new Error('Some error'),
				reset: resetFn,
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('add-relation-button'))
			await user.type(screen.getByLabelText('Relation Type (Property ID)'), 'SOME_TYPE')

			// Close via Cancel button
			await user.click(screen.getByRole('button', { name: 'Cancel' }))

			expect(resetFn).toHaveBeenCalled()

			// Re-open - should have clean state
			mockUseCreateRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			await user.click(screen.getByTestId('add-relation-button'))
			expect(screen.getByLabelText('Relation Type (Property ID)')).toHaveValue('')
			expect(screen.queryByTestId('add-relation-error')).not.toBeInTheDocument()
		})
	})

	describe('Remove Relation', () => {
		it('renders remove button per relation row', () => {
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByTestId('remove-relation-button-0')).toBeInTheDocument()
			expect(screen.getByTestId('remove-relation-button-1')).toBeInTheDocument()
		})

		it('remove buttons have accessible labels', () => {
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByLabelText(/Remove TYPE relation/)).toBeInTheDocument()
			expect(screen.getByLabelText(/Remove REFERENCES relation/)).toBeInTheDocument()
		})

		it('opens confirmation dialog when remove button is clicked', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))

			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(screen.getByText('Remove Relation')).toBeInTheDocument()
			expect(screen.getByText('Cancel')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
		})

		it('confirmation dialog shows relation details', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			// Click remove on outgoing relation (TYPE → type-entity)
			await user.click(screen.getByTestId('remove-relation-button-0'))

			const dialog = screen.getByRole('dialog')
			expect(dialog.querySelector('[data-slot="dialog-title"]')).toHaveTextContent(
				'Remove Relation',
			)
			// Description should mention the relation type
			expect(dialog).toHaveTextContent('TYPE')
		})

		it('shows incoming relation details correctly', async () => {
			const user = userEvent.setup()
			render(<RelationsPanel entityId={entityId} outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))

			const dialog = screen.getByRole('dialog')
			// Description should mention "from" direction and source entity
			expect(dialog).toHaveTextContent('LINKS_TO')
			expect(dialog).toHaveTextContent('source-e')
		})

		it('canceling remove dialog does not fire mutation', async () => {
			const user = userEvent.setup()
			const mutateFn = vi.fn()
			const mutateAsyncFn = vi.fn()
			mockUseDeleteRelation.mockReturnValue({
				mutate: mutateFn,
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))
			await user.click(screen.getByRole('button', { name: 'Cancel' }))

			expect(mutateFn).not.toHaveBeenCalled()
			expect(mutateAsyncFn).not.toHaveBeenCalled()
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		})

		it('confirming remove fires deleteRelation mutation with correct params', async () => {
			const user = userEvent.setup()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			mockUseDeleteRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))
			await user.click(screen.getByRole('button', { name: 'Remove' }))

			expect(mutateAsyncFn).toHaveBeenCalledWith({
				id: 'rel-outgoing-1',
				entityId,
			})
		})

		it('closes dialog after successful removal', async () => {
			const user = userEvent.setup()
			const resetFn = vi.fn()
			const mutateAsyncFn = vi.fn().mockResolvedValue({ id: 'edit-id' })
			mockUseDeleteRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: mutateAsyncFn,
				isLoading: false,
				error: null,
				reset: resetFn,
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))
			await user.click(screen.getByRole('button', { name: 'Remove' }))

			// Dialog should close
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(resetFn).toHaveBeenCalled()
		})

		it('shows error in dialog when mutation fails', async () => {
			const user = userEvent.setup()
			mockUseDeleteRelation.mockReturnValue({
				mutate: vi.fn(),
				mutateAsync: vi.fn(),
				isLoading: false,
				error: new Error('Relation deletion failed'),
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))

			expect(screen.getByTestId('remove-relation-error')).toHaveTextContent(
				'Relation deletion failed',
			)
		})

		it('disables buttons during loading state', async () => {
			const user = userEvent.setup()
			const mutateFn = vi.fn()
			mockUseDeleteRelation.mockReturnValue({
				mutate: mutateFn,
				mutateAsync: vi.fn(),
				isLoading: true,
				error: null,
				reset: vi.fn(),
				data: undefined,
			})

			render(<RelationsPanel entityId={entityId} outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByTestId('remove-relation-button-0'))

			// Find buttons within the dialog
			const dialog = screen.getByRole('dialog')
			const buttons = dialog.querySelectorAll('button')
			// Should have Cancel and Remove buttons, both disabled during loading
			const removeBtn = Array.from(buttons).find((b) => b.textContent?.includes('Remove'))
			const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('Cancel'))
			expect(removeBtn).toBeDisabled()
			expect(cancelBtn).toBeDisabled()
		})
	})
})
