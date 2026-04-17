import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
	it('renders pending status with warning variant', () => {
		render(<StatusBadge status="pending" />)

		const badge = screen.getByText('Pending')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveAttribute('data-variant', 'warning')
	})

	it('renders processing status with info variant', () => {
		render(<StatusBadge status="processing" />)

		const badge = screen.getByText('Processing')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveAttribute('data-variant', 'info')
	})

	it('renders applied status with success variant', () => {
		render(<StatusBadge status="applied" />)

		const badge = screen.getByText('Applied')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveAttribute('data-variant', 'success')
	})

	it('renders failed status with destructive variant', () => {
		render(<StatusBadge status="failed" />)

		const badge = screen.getByText('Failed')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveAttribute('data-variant', 'destructive')
	})

	it('applies custom className', () => {
		render(<StatusBadge status="pending" className="custom-class" />)

		const badge = screen.getByText('Pending')
		expect(badge).toHaveClass('custom-class')
	})

	it('has rounded-full styling', () => {
		render(<StatusBadge status="applied" />)

		const badge = screen.getByText('Applied')
		expect(badge).toHaveClass('rounded-full')
	})
})
