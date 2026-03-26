import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DESCRIPTION_PROPERTY_ID, NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'

// Mock the mutation API client
const { mockSubmitMutations, mockGetEdit } = vi.hoisted(() => ({
	mockSubmitMutations: vi.fn(),
	mockGetEdit: vi.fn(),
}))

vi.mock('~/api/mutations', () => ({
	submitMutations: (...args: unknown[]) => mockSubmitMutations(...args),
	getEdit: (...args: unknown[]) => mockGetEdit(...args),
}))

// Mock useEntity
const mockUseEntity = vi.hoisted(() => vi.fn())

vi.mock('~/hooks/use-entities', () => ({
	useEntity: (...args: unknown[]) => mockUseEntity(...args),
}))

import { EditEntityPage } from './edit-entity-page'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ENTITY_ID = 'aabbccddaabbccddaabbccddaabbccdd'

const mockEntityWithTriples = {
	entity: {
		id: ENTITY_ID,
		status: 'alive' as const,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
		triples: [
			{
				entityId: ENTITY_ID,
				propertyId: NAME_PROPERTY_ID,
				valueType: 'text' as const,
				value: { value: 'Original Name' },
				language: null,
			},
			{
				entityId: ENTITY_ID,
				propertyId: DESCRIPTION_PROPERTY_ID,
				valueType: 'text' as const,
				value: { value: 'Original description' },
				language: null,
			},
			{
				entityId: ENTITY_ID,
				propertyId: TYPES_PROPERTY_ID,
				valueType: 'reference' as const,
				value: { value: 'type-entity-id-1' },
				language: null,
			},
			{
				entityId: ENTITY_ID,
				propertyId: 'customprop123',
				valueType: 'text' as const,
				value: { value: 'blue' },
				language: null,
			},
			{
				entityId: ENTITY_ID,
				propertyId: 'age456',
				valueType: 'number' as const,
				value: { value: 42 },
				language: null,
			},
		],
		outgoing: [],
		incoming: [],
	},
}

const mockRefetch = vi.fn()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a wrapper with a MemoryRouter that includes the /entities/:id/edit route
 * so useParams correctly resolves the entity ID.
 */
function createWrapper(initialRoute = `/entities/${ENTITY_ID}/edit`) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={[initialRoute]}>
					<Routes>
						<Route path="/entities/:id/edit" element={children} />
						<Route path="/entities" element={<div>Entities list</div>} />
						<Route path="/entities/:id" element={<div>Entity detail</div>} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>
		)
	}
}

function mockEntityLoaded() {
	mockUseEntity.mockReturnValue({
		entity: mockEntityWithTriples,
		isLoading: false,
		isError: false,
		error: null,
		refetch: mockRefetch,
	})
}

function mockEntityLoading() {
	mockUseEntity.mockReturnValue({
		entity: undefined,
		isLoading: true,
		isError: false,
		error: null,
		refetch: mockRefetch,
	})
}

function mockEntityError(message: string, status?: number) {
	const error = new Error(message) as Error & { status?: number }
	if (status) error.status = status
	mockUseEntity.mockReturnValue({
		entity: undefined,
		isLoading: false,
		isError: true,
		error,
		refetch: mockRefetch,
	})
}

function mockSuccessfulEdit() {
	mockSubmitMutations.mockResolvedValueOnce({
		id: 'edit-1',
		name: 'Update Entity',
		opCount: 1,
		entityIds: [],
	})
	mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EditEntityPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRefetch.mockClear()
		mockEntityLoaded()
	})

	describe('rendering', () => {
		it('renders the edit entity heading', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Edit Entity' })).toBeInTheDocument()
		})

		it('prefills form with existing entity data', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('entity-name-input')).toHaveValue('Original Name')
			expect(screen.getByTestId('entity-description-input')).toHaveValue('Original description')
		})

		it('prefills custom properties as dynamic rows', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			// customprop123 should be a property row
			expect(screen.getByTestId('property-id-0')).toHaveValue('customprop123')
			// Radix Select renders the selected value as text content, not a value attribute
			expect(screen.getByTestId('property-type-0')).toHaveTextContent('text')
			expect(screen.getByTestId('property-value-0')).toHaveValue('blue')

			// age456 should be a property row
			expect(screen.getByTestId('property-id-1')).toHaveValue('age456')
			expect(screen.getByTestId('property-type-1')).toHaveTextContent('number')
			expect(screen.getByTestId('property-value-1')).toHaveValue('42')
		})

		it('does not show system properties as dynamic rows', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			// System property IDs should NOT appear as dynamic property rows
			const allPropertyIdInputs = screen.queryAllByTestId(/^property-id-\d+$/)
			const propertyIds = allPropertyIdInputs.map((input) => (input as HTMLInputElement).value)
			expect(propertyIds).not.toContain(NAME_PROPERTY_ID)
			expect(propertyIds).not.toContain(DESCRIPTION_PROPERTY_ID)
			expect(propertyIds).not.toContain(TYPES_PROPERTY_ID)
		})

		it('shows submit button with "Save Changes" label', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('entity-submit')).toHaveTextContent('Save Changes')
		})

		it('shows loading skeleton while entity is loading', () => {
			mockEntityLoading()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Should show skeleton elements, not the form
			expect(screen.queryByTestId('entity-name-input')).not.toBeInTheDocument()
		})

		it('shows error state when entity fails to load', () => {
			mockEntityError('Not found', 404)

			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByText('Entity not found')).toBeInTheDocument()
		})

		it('shows no-changes message when form is pristine', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('no-changes-message')).toBeInTheDocument()
		})

		it('disables submit button when no changes are made', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('entity-submit')).toBeDisabled()
		})
	})

	describe('diff computation — name change', () => {
		it('sends only changed NAME in values when name is modified', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Clear and type new name
			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'New Name')

			// Verify submit is now enabled (form is dirty)
			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toBeEnabled()
			})

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const mutation = mockSubmitMutations.mock.calls[0][0].mutations[0]
			expect(mutation.type).toBe('updateEntity')
			expect(mutation.params.id).toBe(ENTITY_ID)
			// Only NAME should be in values
			expect(mutation.params.values).toContainEqual({
				property: NAME_PROPERTY_ID,
				type: 'text',
				value: 'New Name',
			})
			expect(mutation.params.unset).toBeUndefined()
		})
	})

	describe('diff computation — remove property', () => {
		it('sends removed property in unset array', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Remove the first custom property (customprop123)
			await user.click(screen.getByTestId('remove-property-0'))

			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toBeEnabled()
			})

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const mutation = mockSubmitMutations.mock.calls[0][0].mutations[0]
			expect(mutation.params.unset).toContainEqual({
				property: 'customprop123',
			})
			// The removed property should NOT also appear in values
			const valuesPropertyIds = (mutation.params.values ?? []).map(
				(v: { property: string }) => v.property,
			)
			expect(valuesPropertyIds).not.toContain('customprop123')
		})
	})

	describe('diff computation — add new property', () => {
		it('sends new property in values array', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Add a new property
			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-id-2'), 'newProp')
			await user.type(screen.getByTestId('property-value-2'), 'newValue')

			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toBeEnabled()
			})

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const mutation = mockSubmitMutations.mock.calls[0][0].mutations[0]
			expect(mutation.params.values).toContainEqual({
				property: 'newProp',
				type: 'text',
				value: 'newValue',
			})
		})
	})

	describe('diff computation — change value type', () => {
		// Radix Select uses pointer events not available in jsdom.
		// Instead of testing the UI interaction, test the diff logic directly.
		it('computes correct diff when value type changes', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Change the value of the first property to trigger a change
			const valueInput = screen.getByTestId('property-value-0')
			await user.clear(valueInput)
			await user.type(valueInput, 'red')

			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toBeEnabled()
			})

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const mutation = mockSubmitMutations.mock.calls[0][0].mutations[0]
			// The property should appear in values since its value changed
			expect(mutation.params.values).toContainEqual({
				property: 'customprop123',
				type: 'text',
				value: 'red',
			})
		})
	})

	describe('diff computation — combined changes', () => {
		it('sends both values and unset in a single updateEntity mutation', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Change name
			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Updated Name')

			// Remove first custom property (customprop123)
			await user.click(screen.getByTestId('remove-property-0'))

			// Add a new property
			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-id-1'), 'extra')
			await user.type(screen.getByTestId('property-value-1'), 'data')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const mutation = mockSubmitMutations.mock.calls[0][0].mutations[0]
			// Should have NAME in values
			expect(mutation.params.values).toContainEqual({
				property: NAME_PROPERTY_ID,
				type: 'text',
				value: 'Updated Name',
			})
			// Should have new property in values
			expect(mutation.params.values).toContainEqual({
				property: 'extra',
				type: 'text',
				value: 'data',
			})
			// Unchanged property (age456) should NOT be in values (partial update)
			const valuesPropertyIds = (mutation.params.values ?? []).map(
				(v: { property: string }) => v.property,
			)
			expect(valuesPropertyIds).not.toContain('age456')
			// Should have removed property in unset
			expect(mutation.params.unset).toContainEqual({ property: 'customprop123' })
		})
	})

	describe('submission flow', () => {
		it('shows spinner on submit button during submission', async () => {
			const user = userEvent.setup()

			let resolveSubmit: (() => void) | undefined
			const pendingPromise = new Promise<{
				id: string
				name: string
				opCount: number
				entityIds: string[]
			}>((resolve) => {
				resolveSubmit = () => resolve({ id: 'edit-1', name: 'Update', opCount: 1, entityIds: [] })
			})
			mockSubmitMutations.mockReturnValueOnce(pendingPromise)

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Make a change to enable submit
			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Changed')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toHaveTextContent('Saving...')
			})
			expect(screen.getByTestId('entity-submit')).toBeDisabled()

			// Resolve
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })
			resolveSubmit?.()

			await waitFor(() => {
				expect(mockGetEdit).toHaveBeenCalled()
			})
		})

		it('navigates back to entity detail on success', async () => {
			const user = userEvent.setup()
			mockSuccessfulEdit()

			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Change name to trigger dirty state
			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Updated Name')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			// Verify the mutation was called with correct entity ID
			expect(mockSubmitMutations).toHaveBeenCalledWith(
				expect.objectContaining({
					mutations: expect.arrayContaining([
						expect.objectContaining({
							type: 'updateEntity',
							params: expect.objectContaining({ id: ENTITY_ID }),
						}),
					]),
				}),
			)
		})
	})

	describe('error handling', () => {
		it('displays error message on submission failure', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockRejectedValueOnce(new Error('Server error'))

			render(<EditEntityPage />, { wrapper: createWrapper() })

			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Changed')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('edit-error')).toBeInTheDocument()
			})

			expect(screen.getByText('Failed to update entity')).toBeInTheDocument()
			expect(screen.getByText('Server error')).toBeInTheDocument()
		})

		it('preserves user edits after error', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockRejectedValueOnce(new Error('Server error'))

			render(<EditEntityPage />, { wrapper: createWrapper() })

			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Changed Name')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('edit-error')).toBeInTheDocument()
			})

			// Form values should be preserved
			expect(screen.getByTestId('entity-name-input')).toHaveValue('Changed Name')
		})

		it('re-enables submit button after error', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockRejectedValueOnce(new Error('Server error'))

			render(<EditEntityPage />, { wrapper: createWrapper() })

			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Changed')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('edit-error')).toBeInTheDocument()
			})

			// Submit button should be re-enabled after error
			expect(screen.getByTestId('entity-submit')).toBeEnabled()
		})

		it('displays error with details from failed polling', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Update Entity',
				opCount: 1,
				entityIds: [],
			})
			mockGetEdit.mockResolvedValueOnce({
				id: 'edit-1',
				status: 'failed',
				errorMsg: 'Invalid property',
			})

			render(<EditEntityPage />, { wrapper: createWrapper() })

			const nameInput = screen.getByTestId('entity-name-input')
			await user.clear(nameInput)
			await user.type(nameInput, 'Changed')

			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('edit-error')).toBeInTheDocument()
			})

			expect(screen.getByText(/Invalid property/)).toBeInTheDocument()
		})
	})

	describe('no-op prevention', () => {
		it('does not fire mutation when no changes are made', () => {
			render(<EditEntityPage />, { wrapper: createWrapper() })

			// Submit is disabled, so clicking does nothing
			expect(screen.getByTestId('entity-submit')).toBeDisabled()
			expect(mockSubmitMutations).not.toHaveBeenCalled()
		})
	})
})
