import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SortArrow } from './sort-arrow'

describe('SortArrow', () => {
	it('renders ascending state', () => {
		render(<SortArrow direction="asc" onDirectionChange={vi.fn()} />)
		const btn = screen.getByRole('button')
		expect(btn.dataset.direction).toBe('asc')
	})

	it('renders descending state', () => {
		render(<SortArrow direction="desc" onDirectionChange={vi.fn()} />)
		const btn = screen.getByRole('button')
		expect(btn.dataset.direction).toBe('desc')
	})

	it('renders none state', () => {
		render(<SortArrow direction="none" onDirectionChange={vi.fn()} />)
		const btn = screen.getByRole('button')
		expect(btn.dataset.direction).toBe('none')
	})

	it('cycles direction on click (none → asc → desc → none)', async () => {
		const user = userEvent.setup()
		const onDirectionChange = vi.fn()
		render(<SortArrow direction="none" onDirectionChange={onDirectionChange} />)

		await user.click(screen.getByRole('button'))
		expect(onDirectionChange).toHaveBeenCalledWith('asc')
	})

	it('clicking when asc cycles to desc', async () => {
		const user = userEvent.setup()
		const onDirectionChange = vi.fn()
		render(<SortArrow direction="asc" onDirectionChange={onDirectionChange} />)

		await user.click(screen.getByRole('button'))
		expect(onDirectionChange).toHaveBeenCalledWith('desc')
	})

	it('clicking when desc cycles to none', async () => {
		const user = userEvent.setup()
		const onDirectionChange = vi.fn()
		render(<SortArrow direction="desc" onDirectionChange={onDirectionChange} />)

		await user.click(screen.getByRole('button'))
		expect(onDirectionChange).toHaveBeenCalledWith('none')
	})
})
