import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Entity } from '~/api/types'
import { EntityTable } from './entity-table'

const mockNavigate = vi.fn()

// Mock react-router's useNavigate
vi.mock('react-router', () => ({
	useNavigate: () => mockNavigate,
}))

const mockEntities: Entity[] = [
	{
		id: 'abc123def456',
		status: 'alive',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
	},
	{
		id: 'xyz789uvw012',
		status: 'deleted',
		createdAt: '2024-01-03T00:00:00Z',
		updatedAt: '2024-01-04T00:00:00Z',
	},
]

describe('EntityTable', () => {
	it('renders table headers', () => {
		render(
			<EntityTable
				entities={mockEntities}
				total={2}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		expect(screen.getByText('ID')).toBeInTheDocument()
		expect(screen.getByText('Status')).toBeInTheDocument()
		expect(screen.getByText('Created')).toBeInTheDocument()
		expect(screen.getByText('Updated')).toBeInTheDocument()
	})

	it('renders entity rows', () => {
		render(
			<EntityTable
				entities={mockEntities}
				total={2}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		expect(screen.getByText('abc123de...')).toBeInTheDocument()
		expect(screen.getByText('xyz789uv...')).toBeInTheDocument()
	})

	it('renders status badges', () => {
		render(
			<EntityTable
				entities={mockEntities}
				total={2}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		expect(screen.getByText('alive')).toBeInTheDocument()
		expect(screen.getByText('deleted')).toBeInTheDocument()
	})

	it('shows loading state', () => {
		render(
			<EntityTable
				entities={[]}
				total={0}
				limit={20}
				offset={0}
				onPageChange={() => {}}
				isLoading
			/>,
		)

		expect(screen.getByText('Loading entities...')).toBeInTheDocument()
	})

	it('shows empty state when no entities', () => {
		render(<EntityTable entities={[]} total={0} limit={20} offset={0} onPageChange={() => {}} />)

		expect(screen.getByText('No entities found.')).toBeInTheDocument()
	})

	it('renders pagination component', () => {
		render(
			<EntityTable
				entities={mockEntities}
				total={100}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		expect(screen.getByText(/showing/i)).toBeInTheDocument()
	})

	it('calls onPageChange when pagination changes', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(
			<EntityTable
				entities={mockEntities}
				total={100}
				limit={20}
				offset={0}
				onPageChange={onPageChange}
			/>,
		)

		await user.click(screen.getByRole('button', { name: /next/i }))

		expect(onPageChange).toHaveBeenCalledWith(20)
	})

	it('navigates to entity detail on row click', async () => {
		const user = userEvent.setup()
		mockNavigate.mockClear()

		render(
			<EntityTable
				entities={mockEntities}
				total={2}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		const row = screen.getByText('abc123de...').closest('tr')
		expect(row).not.toBeNull()
		await user.click(row as HTMLElement)

		expect(mockNavigate).toHaveBeenCalledWith('/entities/abc123def456')
	})
})
