import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypePill } from './type-pill'

describe('TypePill', () => {
	it('renders Entity kind with blue styling', () => {
		render(<TypePill kind="Entity" />)
		const pill = screen.getByText('Entity')
		expect(pill).toBeInTheDocument()
		expect(pill.dataset.kind).toBe('Entity')
	})

	it('renders Property kind with amber styling', () => {
		render(<TypePill kind="Property" />)
		const pill = screen.getByText('Property')
		expect(pill.dataset.kind).toBe('Property')
	})

	it('renders Type kind with purple styling', () => {
		render(<TypePill kind="Type" />)
		const pill = screen.getByText('Type')
		expect(pill.dataset.kind).toBe('Type')
	})

	it('renders unknown kind with neutral styling', () => {
		render(<TypePill kind="Unknown" />)
		const pill = screen.getByText('Unknown')
		expect(pill.dataset.kind).toBe('unknown')
	})

	it('applies pill shape (border-radius 9999px)', () => {
		render(<TypePill kind="Entity" />)
		const pill = screen.getByText('Entity')
		expect(pill.className).toContain('rounded-full')
	})
})
