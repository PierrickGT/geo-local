import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TruncateId } from './truncate-id'

describe('TruncateId', () => {
	it('renders truncated ID with default length of 8', () => {
		render(<TruncateId id="0123456789abcdef" />)
		expect(screen.getByText('01234567...')).toBeInTheDocument()
	})

	it('renders full ID when shorter than max length', () => {
		render(<TruncateId id="abc" />)
		expect(screen.getByText('abc')).toBeInTheDocument()
	})

	it('renders with custom max length', () => {
		render(<TruncateId id="0123456789abcdef" maxLength={4} />)
		expect(screen.getByText('0123...')).toBeInTheDocument()
	})

	it('shows full ID in title attribute', () => {
		render(<TruncateId id="0123456789abcdef" />)
		expect(screen.getByTitle('0123456789abcdef')).toBeInTheDocument()
	})

	it('renders copy button', () => {
		render(<TruncateId id="abc123" />)
		expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument()
	})

	it('copies ID to clipboard when button clicked', async () => {
		const user = userEvent.setup()
		const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce(undefined)

		render(<TruncateId id="abc123" />)

		await user.click(screen.getByRole('button'))

		expect(clipboardSpy).toHaveBeenCalledWith('abc123')
		clipboardSpy.mockRestore()
	})

	it('shows copied state after clicking', async () => {
		const user = userEvent.setup()
		vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce(undefined)

		render(<TruncateId id="abc123" />)

		await user.click(screen.getByRole('button'))

		expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
	})
})
