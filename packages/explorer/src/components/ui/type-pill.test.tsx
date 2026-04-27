import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypePill } from './type-pill'

describe('TypePill', () => {
	it('renders Entity kind with blue styling', () => {
		render(<TypePill kind="Entity" />)
		const pill = screen.getByText('Entity')
		expect(pill).toBeInTheDocument()
		expect(pill.dataset.kind).toBe('Entity')
		expect(pill.className).toContain('bg-accent/10')
		expect(pill.className).toContain('text-accent')
	})

	it('renders Property kind with amber styling', () => {
		render(<TypePill kind="Property" />)
		const pill = screen.getByText('Property')
		expect(pill.dataset.kind).toBe('Property')
		expect(pill.className).toContain('bg-warning/10')
	})

	it('renders Type kind with purple styling', () => {
		render(<TypePill kind="Type" />)
		const pill = screen.getByText('Type')
		expect(pill.dataset.kind).toBe('Type')
		expect(pill.className).toContain('bg-purple/10')
		expect(pill.className).toContain('text-purple')
	})

	it('renders unknown kind with neutral styling', () => {
		render(<TypePill kind="Unknown" />)
		const pill = screen.getByText('Unknown')
		expect(pill.dataset.kind).toBe('unknown')
		expect(pill.className).toContain('bg-muted')
		expect(pill.className).toContain('text-muted-foreground')
	})

	it('applies pill shape (border-radius 9999px)', () => {
		render(<TypePill kind="Entity" />)
		const pill = screen.getByText('Entity')
		expect(pill.className).toContain('rounded-full')
	})
})
