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

describe('EntityTable sort headers', () => {
	it('renders sortable column headers', () => {
		renderWithRouter(<EntityTable {...baseProps} entities={entities} />)

		expect(screen.getByText('Properties')).toBeTruthy()
		expect(screen.getByText('Created')).toBeTruthy()
		expect(screen.getByText('Updated')).toBeTruthy()
	})

	it('shows sort icon on the active sort column', () => {
		renderWithRouter(
			<EntityTable
				{...baseProps}
				entities={entities}
				currentSort="created_at"
				currentOrder="asc"
			/>,
		)

		const createdHeader = screen.getByText('Created').closest('th')
		expect(createdHeader?.getAttribute('data-sort-column')).toBe('created_at')
		expect(screen.getByText('Created').className).toContain('text-blue-600')
	})

	it('calls onSortChange when clicking a different column', async () => {
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

		await userEvent.click(screen.getByText('Properties'))

		expect(onSortChange).toHaveBeenCalledWith('properties_text', 'desc')
	})

	it('toggles order when clicking the same column', async () => {
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

		await userEvent.click(screen.getByText('Updated'))

		expect(onSortChange).toHaveBeenCalledWith('updated_at', 'asc')
	})
})
