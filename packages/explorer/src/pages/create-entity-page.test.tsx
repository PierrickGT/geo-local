import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the mutation API client so the real useCreateEntity hook manages its own state
const { mockSubmitMutations, mockGetEdit } = vi.hoisted(() => ({
	mockSubmitMutations: vi.fn(),
	mockGetEdit: vi.fn(),
}))

vi.mock('~/api/mutations', () => ({
	submitMutations: (...args: unknown[]) => mockSubmitMutations(...args),
	getEdit: (...args: unknown[]) => mockGetEdit(...args),
}))

import { CreateEntityPage } from './create-entity-page'

// Helper to create wrapper with all providers
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={['/entities/new']}>{children}</MemoryRouter>
			</QueryClientProvider>
		)
	}
}

describe('CreateEntityPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('rendering', () => {
		it('renders the create entity heading', () => {
			render(<CreateEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByRole('heading', { name: 'Create Entity' })).toBeInTheDocument()
		})

		it('renders EntityForm in create mode', () => {
			render(<CreateEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('entity-name-input')).toBeInTheDocument()
			expect(screen.getByTestId('entity-description-input')).toBeInTheDocument()
			expect(screen.getByTestId('entity-types-input')).toBeInTheDocument()
			expect(screen.getByTestId('entity-submit')).toBeInTheDocument()
			expect(screen.getByTestId('entity-submit')).toHaveTextContent('Create Entity')
		})

		it('renders the Add Property button', () => {
			render(<CreateEntityPage />, { wrapper: createWrapper() })

			expect(screen.getByTestId('add-property')).toBeInTheDocument()
		})
	})

	describe('submission', () => {
		it('calls submitMutations with correct payload', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Create Entity',
				opCount: 1,
				entityIds: ['new-entity-id'],
			})
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			expect(mockSubmitMutations).toHaveBeenCalledWith({
				mutations: [
					{
						type: 'createEntity',
						params: {
							name: 'Test Entity',
							description: undefined,
							values: undefined,
							types: undefined,
						},
					},
				],
			})
		})

		it('parses types from comma-separated string', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Create Entity',
				opCount: 1,
				entityIds: ['new-entity-id'],
			})
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.type(screen.getByTestId('entity-types-input'), 'Person,Organization')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledWith(
					expect.objectContaining({
						mutations: expect.arrayContaining([
							expect.objectContaining({
								params: expect.objectContaining({
									types: ['Person', 'Organization'],
								}),
							}),
						]),
					}),
				)
			})
		})

		it('sends property values in correct format', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Create Entity',
				opCount: 1,
				entityIds: ['new-entity-id'],
			})
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-id-0'), 'color')
			await user.type(screen.getByTestId('property-value-0'), 'blue')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledWith(
					expect.objectContaining({
						mutations: expect.arrayContaining([
							expect.objectContaining({
								params: expect.objectContaining({
									values: [{ property: 'color', type: 'text', value: 'blue' }],
								}),
							}),
						]),
					}),
				)
			})
		})

		it('filters out property rows with empty propertyId', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Create Entity',
				opCount: 1,
				entityIds: ['new-entity-id'],
			})
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-value-0'), 'some-value')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(mockSubmitMutations).toHaveBeenCalledTimes(1)
			})

			const calledParams = mockSubmitMutations.mock.calls[0][0].mutations[0].params
			expect(calledParams.values).toBeUndefined()
		})
	})

	describe('error handling', () => {
		it('displays error message when submission fails', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockRejectedValueOnce(new Error('Network error'))

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('create-error')).toBeInTheDocument()
			})

			expect(screen.getByText('Failed to create entity')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})

		it('preserves form data after error', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockRejectedValueOnce(new Error('Server error'))

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'My Entity')
			await user.type(screen.getByTestId('entity-description-input'), 'Some description')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('create-error')).toBeInTheDocument()
			})

			expect(screen.getByTestId('entity-name-input')).toHaveValue('My Entity')
			expect(screen.getByTestId('entity-description-input')).toHaveValue('Some description')
		})

		it('displays error with details from failed polling', async () => {
			const user = userEvent.setup()
			mockSubmitMutations.mockResolvedValueOnce({
				id: 'edit-1',
				name: 'Create Entity',
				opCount: 1,
				entityIds: [],
			})
			mockGetEdit.mockResolvedValueOnce({
				id: 'edit-1',
				status: 'failed',
				errorMsg: 'Invalid property type',
			})

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('entity-submit'))

			await waitFor(() => {
				expect(screen.getByTestId('create-error')).toBeInTheDocument()
			})

			expect(screen.getByText(/Invalid property type/)).toBeInTheDocument()
		})

		it('submit button shows Saving... and is disabled during submission', async () => {
			const user = userEvent.setup()

			// Create a controlled promise
			let resolveSubmit: () => void
			const pendingPromise = new Promise<{
				id: string
				name: string
				opCount: number
				entityIds: string[]
			}>((resolve) => {
				resolveSubmit = () =>
					resolve({ id: 'edit-1', name: 'Create', opCount: 1, entityIds: ['e1'] })
			})
			mockSubmitMutations.mockReturnValueOnce(pendingPromise)

			render(<CreateEntityPage />, { wrapper: createWrapper() })

			await user.type(screen.getByTestId('entity-name-input'), 'Test Entity')
			await user.click(screen.getByTestId('entity-submit'))

			// Button should show Saving... while pending
			await waitFor(() => {
				expect(screen.getByTestId('entity-submit')).toHaveTextContent('Saving...')
			})
			expect(screen.getByTestId('entity-submit')).toBeDisabled()

			// Resolve the mutation
			mockGetEdit.mockResolvedValueOnce({ id: 'edit-1', status: 'applied' })
			resolveSubmit?.()

			await waitFor(() => {
				expect(mockGetEdit).toHaveBeenCalled()
			})
		})
	})
})
