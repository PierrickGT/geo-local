import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Relation } from '~/api/types'
import { RelationsPanel } from './relations-panel'

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
			fromId: 'test-entity',
			toId: 'type-entity',
			relationType: 'TYPE',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
		{
			fromId: 'test-entity',
			toId: 'related-entity-1',
			relationType: 'REFERENCES',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
	]

	const mockIncoming: Relation[] = [
		{
			fromId: 'source-entity',
			toId: 'test-entity',
			relationType: 'LINKS_TO',
			status: 'alive',
			createdAt: '2024-01-01T00:00:00Z',
		},
	]

	describe('rendering', () => {
		it('renders both tabs', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByRole('button', { name: /Outgoing/ })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Incoming/ })).toBeInTheDocument()
		})

		it('shows outgoing relations by default', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByText('TYPE')).toBeInTheDocument()
			expect(screen.getByText('REFERENCES')).toBeInTheDocument()
		})

		it('displays relation counts in tab labels', () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Check tab contains the count - it's part of the button text
			expect(screen.getByRole('button', { name: /Outgoing.*2/ })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Incoming.*1/ })).toBeInTheDocument()
		})
	})

	describe('tab switching', () => {
		it('switches to incoming tab on click', async () => {
			const user = userEvent.setup()

			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByRole('button', { name: /Incoming \(1\)/ }))

			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()
			expect(screen.queryByText('TYPE')).not.toBeInTheDocument()
		})

		it('switches back to outgoing tab', async () => {
			const user = userEvent.setup()

			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Switch to incoming
			await user.click(screen.getByRole('button', { name: /Incoming \(1\)/ }))
			expect(screen.getByText('LINKS_TO')).toBeInTheDocument()

			// Switch back to outgoing
			await user.click(screen.getByRole('button', { name: /Outgoing \(2\)/ }))
			expect(screen.getByText('TYPE')).toBeInTheDocument()
		})
	})

	describe('entity navigation', () => {
		it('displays linked entity IDs as clickable', async () => {
			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			// Outgoing shows toId
			expect(screen.getByText(/type-ent/)).toBeInTheDocument()
			expect(screen.getByText(/related/)).toBeInTheDocument()
		})

		it('shows incoming source entities when on incoming tab', async () => {
			const user = userEvent.setup()

			render(<RelationsPanel outgoing={mockOutgoing} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByRole('button', { name: /Incoming \(1\)/ }))

			// Incoming shows fromId
			expect(screen.getByText(/source-e/)).toBeInTheDocument()
		})
	})

	describe('empty states', () => {
		it('shows empty state when no outgoing relations', () => {
			render(<RelationsPanel outgoing={[]} incoming={mockIncoming} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByText('No outgoing relations found.')).toBeInTheDocument()
		})

		it('shows empty state when no incoming relations', async () => {
			const user = userEvent.setup()

			render(<RelationsPanel outgoing={mockOutgoing} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			await user.click(screen.getByRole('button', { name: /Incoming \(0\)/ }))

			expect(screen.getByText('No incoming relations found.')).toBeInTheDocument()
		})

		it('shows empty state when no relations at all', () => {
			render(<RelationsPanel outgoing={[]} incoming={[]} />, {
				wrapper: createWrapper(),
			})

			expect(screen.getByText('No outgoing relations found.')).toBeInTheDocument()
		})
	})

	describe('truncation', () => {
		it('truncates long relation types', () => {
			const longTypeRelation: Relation = {
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
})
