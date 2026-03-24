import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
	it('renders with placeholder text', () => {
		render(<SearchInput value="" onChange={vi.fn()} />)
		expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument()
	})

	it('displays the current value', () => {
		render(<SearchInput value="test query" onChange={vi.fn()} />)
		expect(screen.getByDisplayValue('test query')).toBeInTheDocument()
	})

	it('calls onChange when typing', async () => {
		const user = userEvent.setup()
		const handleChange = vi.fn()

		render(<SearchInput value="" onChange={handleChange} />)

		const input = screen.getByRole('searchbox')
		await user.type(input, 'hello')

		// Should be called once for each character
		expect(handleChange).toHaveBeenCalledTimes(5)
	})

	it('shows search icon (aria-hidden)', () => {
		render(<SearchInput value="" onChange={vi.fn()} />)
		// Lucide icons have aria-hidden, use hidden: true to query them
		const icon = screen.getByRole('img', { hidden: true })
		expect(icon).toBeInTheDocument()
	})

	it('has accessible label', () => {
		render(<SearchInput value="" onChange={vi.fn()} />)
		expect(screen.getByLabelText('Search entities')).toBeInTheDocument()
	})

	it('applies custom className', () => {
		render(<SearchInput value="" onChange={vi.fn()} className="custom-class" />)

		const input = screen.getByRole('searchbox')
		expect(input).toHaveClass('custom-class')
	})

	it('handles empty string value', () => {
		render(<SearchInput value="" onChange={vi.fn()} />)

		const input = screen.getByRole('searchbox')
		expect(input).toHaveValue('')
	})
})
