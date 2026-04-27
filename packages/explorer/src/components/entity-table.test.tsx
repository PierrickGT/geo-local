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

	it('renders type pill in each row — default is Entity', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		expect(screen.getByText('Entity')).toBeInTheDocument()
	})

	describe('Color dots by entity type (VAL-ENTITIES-005)', () => {
		it('renders accent blue dot by default', () => {
			renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

			const dot = screen.getByTestId('entity-dot-0')
			expect(dot).toBeTruthy()
			expect(dot.style.background).toBe('var(--color-accent)')
		})

		it('renders amber dot when activeTypeFilter is Property', () => {
			renderWithRouter(
				<EntityTable {...baseProps} entities={entities} activeTypeFilter="Property" />,
			)

			const dot = screen.getByTestId('entity-dot-0')
			expect(dot).toBeTruthy()
			expect(dot.style.background).toBe('var(--color-warning)')
		})

		it('renders accent blue dot when activeTypeFilter is Entity', () => {
			renderWithRouter(<EntityTable {...baseProps} entities={entities} activeTypeFilter="Entity" />)

			const dot = screen.getByTestId('entity-dot-0')
			expect(dot).toBeTruthy()
			expect(dot.style.background).toBe('var(--color-accent)')
		})

		it('renders multiple entities with correct dot colors', () => {
			const multipleEntities = [
				{
					id: 'aaaabbbbccccdddd',
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z',
					propertiesText: 'Entity A',
				},
				{
					id: 'eeeeffff11112222',
					createdAt: '2025-01-03T00:00:00Z',
					updatedAt: '2025-01-04T00:00:00Z',
					propertiesText: 'Entity B',
				},
			]

			renderWithRouter(
				<EntityTable {...baseProps} entities={multipleEntities} activeTypeFilter="Property" />,
			)

			const dot0 = screen.getByTestId('entity-dot-0')
			const dot1 = screen.getByTestId('entity-dot-1')
			expect(dot0.style.background).toBe('var(--color-warning)')
			expect(dot1.style.background).toBe('var(--color-warning)')
		})
	})

	describe('Type pill reflects active type filter context', () => {
		it('shows "Property" when activeTypeFilter is Property', () => {
			renderWithRouter(
				<EntityTable {...baseProps} entities={entities} activeTypeFilter="Property" />,
			)

			expect(screen.getByText('Property')).toBeInTheDocument()
		})

		it('shows "Entity" when activeTypeFilter is Entity', () => {
			renderWithRouter(<EntityTable {...baseProps} entities={entities} activeTypeFilter="Entity" />)

			expect(screen.getByText('Entity')).toBeInTheDocument()
		})

		it('shows "Entity" when no activeTypeFilter provided', () => {
			renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

			expect(screen.getByText('Entity')).toBeInTheDocument()
		})
	})
})
