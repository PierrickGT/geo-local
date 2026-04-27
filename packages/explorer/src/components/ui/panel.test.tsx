import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from './panel'

describe('Panel', () => {
	it('renders title and children', () => {
		render(<Panel title="Graph neighborhood">content here</Panel>)
		expect(screen.getByText('Graph neighborhood')).toBeInTheDocument()
		expect(screen.getByText('content here')).toBeInTheDocument()
	})

	it('renders optional right slot', () => {
		render(
			<Panel title="Activity" right={<span>3 nodes</span>}>
				content
			</Panel>,
		)
		expect(screen.getByText('3 nodes')).toBeInTheDocument()
	})

	it('applies border-radius from design token', () => {
		render(<Panel title="Test">content</Panel>)
		const panel = screen.getByText('Test').closest('[data-slot="panel"]')
		expect(panel).toBeInTheDocument()
		expect(panel?.className).toContain('rounded-lg')
	})

	it('has data-slot attribute', () => {
		render(<Panel title="Test">content</Panel>)
		expect(screen.getByText('Test').closest('[data-slot="panel"]')).toBeInTheDocument()
	})

	it('applies white background and border', () => {
		render(<Panel title="Test">content</Panel>)
		const panel = screen.getByText('Test').closest('[data-slot="panel"]')
		expect(panel?.className).toContain('bg-card')
		expect(panel?.className).toContain('border')
	})
})
