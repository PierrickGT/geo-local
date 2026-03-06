import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
	it('renders pending status with correct label and styling', () => {
		render(<StatusBadge status="pending" />)

		const badge = screen.getByText('Pending')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('bg-amber-100', 'text-amber-800', 'border-amber-200')
	})

	it('renders processing status with correct label and styling', () => {
		render(<StatusBadge status="processing" />)

		const badge = screen.getByText('Processing')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
	})

	it('renders applied status with correct label and styling', () => {
		render(<StatusBadge status="applied" />)

		const badge = screen.getByText('Applied')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
	})

	it('renders failed status with correct label and styling', () => {
		render(<StatusBadge status="failed" />)

		const badge = screen.getByText('Failed')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
	})

	it('applies custom className', () => {
		render(<StatusBadge status="pending" className="custom-class" />)

		const badge = screen.getByText('Pending')
		expect(badge).toHaveClass('custom-class')
	})

	it('has correct badge structure', () => {
		render(<StatusBadge status="applied" />)

		const badge = screen.getByText('Applied')
		expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full')
	})
})
