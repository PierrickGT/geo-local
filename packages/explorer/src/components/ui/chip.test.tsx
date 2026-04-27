import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from './chip'

describe('Chip', () => {
	it('renders inactive state as outlined', () => {
		render(<Chip>All</Chip>)
		const chip = screen.getByRole('button', { name: 'All' })
		expect(chip).toBeInTheDocument()
		expect(chip.dataset.active).toBe('false')
	})

	it('renders active state as ink-filled', () => {
		render(<Chip active>All</Chip>)
		const chip = screen.getByRole('button', { name: 'All' })
		expect(chip.dataset.active).toBe('true')
	})

	it('fires onClick handler', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		render(<Chip onClick={onClick}>All</Chip>)

		await user.click(screen.getByRole('button', { name: 'All' }))
		expect(onClick).toHaveBeenCalledOnce()
	})

	it('renders children content', () => {
		render(<Chip>Entities 8,204</Chip>)
		expect(screen.getByRole('button', { name: 'Entities 8,204' })).toBeInTheDocument()
	})

	it('has cursor pointer', () => {
		render(<Chip>All</Chip>)
		const chip = screen.getByRole('button', { name: 'All' })
		expect(chip.className).toContain('cursor-pointer')
	})
})
