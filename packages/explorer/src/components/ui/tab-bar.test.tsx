import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TabBar } from './tab-bar'

const tabs = [
	{ id: 'props', label: 'Properties · 2' },
	{ id: 'relations', label: 'Relations · 3' },
	{ id: 'json', label: 'JSON' },
]

describe('TabBar', () => {
	it('renders all tabs', () => {
		render(<TabBar tabs={tabs} activeTab="props" onTabChange={vi.fn()} />)
		for (const tab of tabs) {
			expect(screen.getByText(tab.label)).toBeInTheDocument()
		}
	})

	it('shows accent underline on active tab', () => {
		render(<TabBar tabs={tabs} activeTab="props" onTabChange={vi.fn()} />)
		const activeTab = screen.getByText('Properties · 2')
		expect(activeTab.dataset.active).toBe('true')
	})

	it('switches tab on click', async () => {
		const user = userEvent.setup()
		const onTabChange = vi.fn()
		render(<TabBar tabs={tabs} activeTab="props" onTabChange={onTabChange} />)

		await user.click(screen.getByText('JSON'))
		expect(onTabChange).toHaveBeenCalledWith('json')
	})

	it('inactive tabs have no accent underline', () => {
		render(<TabBar tabs={tabs} activeTab="props" onTabChange={vi.fn()} />)
		const inactiveTab = screen.getByText('JSON')
		expect(inactiveTab.dataset.active).toBe('false')
	})
})
