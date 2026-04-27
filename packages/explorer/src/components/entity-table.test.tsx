import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { EntityTable } from './entity-table'

const baseProps = {
	total: 1,
	limit: 20,
	offset: 0,
	onPageChange: vi.fn(),
}

const entities = [
	{
		id: 'aaaabbbbccccdddd',
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-02T00:00:00Z',
		propertiesText: 'Test Entity',
	},
]

function renderWithRouter(ui: React.ReactElement) {
	return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('EntityTable', () => {
	it('renders entity names in rows', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		expect(screen.getByText('Test Entity')).toBeTruthy()
	})

	it('renders sort arrows on Name and Updated columns', () => {
		renderWithRouter(
			<EntityTable
				{...baseProps}
				entities={entities}
				currentSort="updated_at"
				currentOrder="desc"
			/>,
		)

		const sortArrows = screen.getAllByTestId('sort-arrow')
		expect(sortArrows.length).toBe(2)
	})

	it('calls onSortChange when sort arrow is clicked', async () => {
		const onSortChange = vi.fn()
		renderWithRouter(
			<EntityTable
				{...baseProps}
				entities={entities}
				currentSort="updated_at"
				currentOrder="desc"
				onSortChange={onSortChange}
			/>,
		)

		const sortArrows = screen.getAllByTestId('sort-arrow')
		// Click the first sort arrow (Name)
		await userEvent.click(sortArrows[0])

		expect(onSortChange).toHaveBeenCalled()
	})

	it('renders chevron in each row', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		const chevrons = screen.getAllByTestId('row-chevron')
		expect(chevrons.length).toBe(1)
	})

	it('renders copy button for each row ID', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		const copyButtons = screen.getAllByTestId('copy-id-button')
		expect(copyButtons.length).toBe(1)
	})

	it('renders checkboxes when selection is enabled', () => {
		renderWithRouter(
			<EntityTable
				{...baseProps}
				entities={entities}
				selectedIds={new Set()}
				onToggleSelection={vi.fn()}
				onToggleSelectAll={vi.fn()}
			/>,
		)

		// Header checkbox + row checkbox
		expect(screen.getByTestId('header-checkbox')).toBeInTheDocument()
		// Entity rows have checkboxes
		const rowCheckboxes = screen.getAllByRole('checkbox')
		expect(rowCheckboxes.length).toBe(2) // header + 1 row
	})

	it('renders pagination footer', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		expect(screen.getByTestId('pagination-footer')).toBeInTheDocument()
	})

	it('shows empty state when no entities', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={[]} />)

		expect(screen.getByText('No entities found.')).toBeInTheDocument()
	})

	it('renders type pill in each row', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		expect(screen.getByText('Entity')).toBeInTheDocument()
	})
})
