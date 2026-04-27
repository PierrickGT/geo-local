import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyIdButton } from './copy-id-button'

describe('CopyIdButton', () => {
	it('renders a button with copy icon', () => {
		render(<CopyIdButton value="abc123" />)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('copies value to clipboard on click', async () => {
		const user = userEvent.setup()
		const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce(undefined)

		render(<CopyIdButton value="abc123" />)

		await user.click(screen.getByRole('button'))
		expect(clipboardSpy).toHaveBeenCalledWith('abc123')
		clipboardSpy.mockRestore()
	})

	it('shows feedback checkmark after copying', async () => {
		const user = userEvent.setup()
		vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce(undefined)

		render(<CopyIdButton value="abc123" />)

		await user.click(screen.getByRole('button'))
		const btn = screen.getByRole('button')
		expect(btn).toHaveAttribute('aria-label', 'Copied')
	})
})
