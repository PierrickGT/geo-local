import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './pagination'

describe('Pagination', () => {
	it('renders pagination container', () => {
		const { container } = render(
			<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />,
		)

		// Check that pagination renders with navigation links
		expect(screen.getByLabelText('Go to first page')).toBeInTheDocument()
		expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
		expect(container.firstChild).toBeInTheDocument()
	})

	it('shows correct range for second page', () => {
		render(<Pagination total={100} limit={20} offset={20} onPageChange={() => {}} />)

		// Check for numbers specific to second page
		expect(screen.getByText('21')).toBeInTheDocument()
	})

	it('shows current page and total pages', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		expect(screen.getByText(/page/i)).toHaveTextContent('Page 1 of 5')
	})

	it('disables first and prev buttons on first page', () => {
		render(<Pagination total={100} limit={20} offset={0} onPageChange={() => {}} />)

		expect(screen.getByLabelText('Go to first page')).toBeDisabled()
		expect(screen.getByLabelText('Go to previous page')).toBeDisabled()
	})

	it('disables next and last buttons on last page', () => {
		render(<Pagination total={100} limit={20} offset={80} onPageChange={() => {}} />)

		expect(screen.getByLabelText('Go to next page')).toBeDisabled()
		expect(screen.getByLabelText('Go to last page')).toBeDisabled()
	})

	it('enables all buttons on middle page', () => {
		render(<Pagination total={100} limit={20} offset={40} onPageChange={() => {}} />)

		expect(screen.getByLabelText('Go to first page')).toBeEnabled()
		expect(screen.getByLabelText('Go to previous page')).toBeEnabled()
		expect(screen.getByLabelText('Go to next page')).toBeEnabled()
		expect(screen.getByLabelText('Go to last page')).toBeEnabled()
	})

	it('calls onPageChange with 0 when first button clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={40} onPageChange={onPageChange} />)

		await user.click(screen.getByLabelText('Go to first page'))

		expect(onPageChange).toHaveBeenCalledWith(0)
	})

	it('calls onPageChange with offset - limit when prev button clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={40} onPageChange={onPageChange} />)

		await user.click(screen.getByLabelText('Go to previous page'))

		expect(onPageChange).toHaveBeenCalledWith(20)
	})

	it('calls onPageChange with offset + limit when next button clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={0} onPageChange={onPageChange} />)

		await user.click(screen.getByLabelText('Go to next page'))

		expect(onPageChange).toHaveBeenCalledWith(20)
	})

	it('calls onPageChange with correct offset when last button clicked', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()

		render(<Pagination total={100} limit={20} offset={0} onPageChange={onPageChange} />)

		await user.click(screen.getByLabelText('Go to last page'))

		expect(onPageChange).toHaveBeenCalledWith(80)
	})

	it('returns null when total is 0', () => {
		const { container } = render(
			<Pagination total={0} limit={20} offset={0} onPageChange={() => {}} />,
		)

		expect(container.firstChild).toBeNull()
	})

	it('handles partial last page correctly', () => {
		render(<Pagination total={95} limit={20} offset={80} onPageChange={() => {}} />)

		// Check for 81 (start of last page)
		expect(screen.getByText('81')).toBeInTheDocument()
	})
})
