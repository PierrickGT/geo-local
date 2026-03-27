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

const aliveEntities: Entity[] = [
	{
		id: 'abc123def456',
		status: 'alive',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
	},
	{
		id: 'def789ghi012',
		status: 'alive',
		createdAt: '2024-01-05T00:00:00Z',
		updatedAt: '2024-01-06T00:00:00Z',
	},
	{
		id: 'xyz789uvw012',
		status: 'deleted',
		createdAt: '2024-01-03T00:00:00Z',
		updatedAt: '2024-01-04T00:00:00Z',
	},
]

// Legacy alias — kept so existing tests that reference mockEntities still compile
const mockEntities: Entity[] = aliveEntities

const defaultSelectionProps = {
	selectedIds: new Set<string>(),
	onToggleSelection: vi.fn(),
	onToggleSelectAll: vi.fn(),
}

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

		// TruncateId now renders the full ID (CSS truncation via overflow-hidden)
		expect(screen.getByText('abc123def456')).toBeInTheDocument()
		expect(screen.getByText('xyz789uvw012')).toBeInTheDocument()
	})

	it('renders status badges', () => {
		render(
			<EntityTable
				entities={mockEntities}
				total={3}
				limit={20}
				offset={0}
				onPageChange={() => {}}
			/>,
		)

		expect(screen.getAllByText('alive')).toHaveLength(2)
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

		// EntityTable loading state uses text "Loading entities..."
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

		// Pagination links are <a> tags with aria-labels, not buttons
		await user.click(screen.getByLabelText('Go to next page'))

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

		// TruncateId renders the full ID text (CSS truncation via overflow-hidden)
		const row = screen.getByText('abc123def456').closest('tr')
		expect(row).not.toBeNull()
		await user.click(row as HTMLElement)

		expect(mockNavigate).toHaveBeenCalledWith('/entities/abc123def456')
	})

	describe('checkbox selection', () => {
		it('no checkbox column when selection props absent', () => {
			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
				/>,
			)

			expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
		})

		it('header and row checkboxes render when selection props provided', () => {
			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					selectedIds={new Set()}
					onToggleSelection={vi.fn()}
					onToggleSelectAll={vi.fn()}
				/>,
			)

			const checkboxes = screen.getAllByRole('checkbox')
			// 1 header + 2 alive rows = 3 checkboxes
			expect(checkboxes).toHaveLength(3)
		})

		it('deleted entity rows show spacer instead of checkbox', () => {
			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					selectedIds={new Set()}
					onToggleSelection={vi.fn()}
					onToggleSelectAll={vi.fn()}
				/>,
			)

			const checkboxes = screen.getAllByRole('checkbox')
			// Header (1) + alive rows (2) — no checkbox for the deleted entity
			expect(checkboxes).toHaveLength(3)

			// Verify the deleted row has a spacer td instead of a checkbox
			const deletedRow = screen.getByText('xyz789uvw012').closest('tr')
			expect(deletedRow).not.toBeNull()
			const deletedRowCheckboxes = deletedRow?.querySelectorAll('input[type="checkbox"]')
			expect(deletedRowCheckboxes).toHaveLength(0)
		})

		it('header checkbox toggles select-all', async () => {
			const user = userEvent.setup()
			const onToggleSelectAll = vi.fn()

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					{...defaultSelectionProps}
					onToggleSelectAll={onToggleSelectAll}
				/>,
			)

			// Header checkbox is the first one
			const headerCheckbox = screen.getAllByRole('checkbox')[0]
			await user.click(headerCheckbox)
			expect(onToggleSelectAll).toHaveBeenCalledTimes(1)

			await user.click(headerCheckbox)
			expect(onToggleSelectAll).toHaveBeenCalledTimes(2)
		})

		it('header checkbox indeterminate state for partial selection', () => {
			// Select only one of two alive entities
			const selectedIds = new Set(['abc123def456'])

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					selectedIds={selectedIds}
					onToggleSelection={vi.fn()}
					onToggleSelectAll={vi.fn()}
				/>,
			)

			const headerCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement
			expect(headerCheckbox.indeterminate).toBe(true)
		})

		it('checkbox click does not trigger row navigation', async () => {
			const user = userEvent.setup()
			mockNavigate.mockClear()

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					{...defaultSelectionProps}
				/>,
			)

			// Click a row checkbox (not the header)
			const rowCheckboxes = screen.getAllByRole('checkbox').slice(1)
			await user.click(rowCheckboxes[0])

			expect(mockNavigate).not.toHaveBeenCalled()
		})

		it('row click outside checkbox still navigates', async () => {
			const user = userEvent.setup()
			mockNavigate.mockClear()

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					{...defaultSelectionProps}
				/>,
			)

			// Click on the ID cell (not the checkbox)
			const idCell = screen.getByText('abc123def456').closest('td')
			expect(idCell).not.toBeNull()
			await user.click(idCell as HTMLElement)

			expect(mockNavigate).toHaveBeenCalledWith('/entities/abc123def456')
		})

		it('shift+click calls onToggleSelection with shiftKey=true', async () => {
			const user = userEvent.setup()
			const onToggleSelection = vi.fn()

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					selectedIds={new Set()}
					onToggleSelection={onToggleSelection}
					onToggleSelectAll={vi.fn()}
				/>,
			)

			const rowCheckboxes = screen.getAllByRole('checkbox').slice(1)
			await user.click(rowCheckboxes[0])

			await user.keyboard('{Shift>}')
			await user.click(rowCheckboxes[1])
			await user.keyboard('{/Shift}')

			expect(onToggleSelection).toHaveBeenCalledWith('def789ghi012', true, 1)
		})

		it('checkboxes are keyboard accessible', async () => {
			const user = userEvent.setup()
			const onToggleSelection = vi.fn()

			render(
				<EntityTable
					entities={aliveEntities}
					total={3}
					limit={20}
					offset={0}
					onPageChange={() => {}}
					selectedIds={new Set()}
					onToggleSelection={onToggleSelection}
					onToggleSelectAll={vi.fn()}
				/>,
			)

			// Tab to the first row checkbox and press Space
			const rowCheckboxes = screen.getAllByRole('checkbox').slice(1)
			rowCheckboxes[0].focus()
			expect(rowCheckboxes[0]).toHaveFocus()

			await user.keyboard(' ')
			expect(onToggleSelection).toHaveBeenCalledWith('abc123def456', false, 0)
		})
	})
})
