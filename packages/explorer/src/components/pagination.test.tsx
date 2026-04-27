import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './pagination'

describe('Pagination', () => {
	it('renders pagination with showing range', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		expect(screen.getByText(/Showing 1/)).toBeInTheDocument()
		expect(screen.getByText(/of 100/)).toBeInTheDocument()
	})

	it('shows correct range for second page', () => {
		render(<Pagination total={100} limit={20} offset={20} onPageChange={() => {}} />)

		// Page 2 with limit 20: items 21-40
		expect(screen.getByText(/Showing 21/)).toBeInTheDocument()
		const footer = screen.getByText(/Showing/)
		expect(footer.textContent).toContain('21')
		expect(footer.textContent).toContain('40')
	})

	it('shows current page as ink-filled button', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		const page1Button = screen.getByRole('button', { name: '1' })
		expect(page1Button).toBeInTheDocument()
		// Current page should have ink-filled style (bg-foreground)
		expect(page1Button.className).toContain('bg-foreground')
	})

	it('disables prev button on first page', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		// The ‹ button should be disabled
		const prevButton = screen.getByText('‹')
		expect(prevButton).toBeDisabled()
	})

	it('disables next button on last page', () => {
		render(<Pagination total={100} limit={20} offset={80} onPageChange={() => {}} />)

		const nextButton = screen.getByText('›')
		expect(nextButton).toBeDisabled()
	})

	it('enables all navigation buttons on middle page', () => {
		render(<Pagination total={100} limit={20} offset={40} onPageChange={() => {}} />)

		const prevButton = screen.getByText('‹')
		const nextButton = screen.getByText('›')
		expect(prevButton).not.toBeDisabled()
		expect(nextButton).not.toBeDisabled()
	})

	it('calls onPageChange with correct offset when prev clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={40} onPageChange={onPageChange} />)

		await user.click(screen.getByText('‹'))

		expect(onPageChange).toHaveBeenCalledWith(20)
	})

	it('calls onPageChange with offset + limit when next clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={0} onPageChange={onPageChange} />)

		await user.click(screen.getByText('›'))

		expect(onPageChange).toHaveBeenCalledWith(20)
	})

	it('returns null when total is 0', () => {
		const { container } = render(
			<Pagination total={0} limit={20} offset={0} onPageChange={() => {}} />,
		)

		expect(container.firstChild).toBeNull()
	})

	it('handles partial last page correctly', () => {
		render(<Pagination total={95} limit={20} offset={80} onPageChange={() => {}} />)

		expect(screen.getByText(/Showing 81/)).toBeInTheDocument()
		expect(screen.getByText(/–95/)).toBeInTheDocument()
	})

	it('renders page number buttons', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		// Should have buttons for page numbers
		expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
	})

	it('navigates to correct page when number clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={0} onPageChange={onPageChange} />)

		await user.click(screen.getByRole('button', { name: '3' }))

		expect(onPageChange).toHaveBeenCalledWith(40)
	})
})
