import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiffPane } from './diff-pane'

describe('DiffPane', () => {
	it('renders before and after content side-by-side', () => {
		render(
			<DiffPane
				before="old value"
				after="new value"
			/>,
		)
		expect(screen.getByText('Before')).toBeInTheDocument()
		expect(screen.getByText('After')).toBeInTheDocument()
	})

	it('renders unchanged content with neutral styling', () => {
		render(<DiffPane before="same" after="same" />)
		const matches = screen.getAllByText('same')
		expect(matches).toHaveLength(2)
	})

	it('applies red styling to before pane', () => {
		render(<DiffPane before="removed" after="added" />)
		const beforeLabel = screen.getByText('Before')
		const beforePane = beforeLabel.closest('[data-slot="diff-before"]')
		expect(beforePane).toBeInTheDocument()
	})

	it('applies green styling to after pane', () => {
		render(<DiffPane before="removed" after="added" />)
		const afterLabel = screen.getByText('After')
		const afterPane = afterLabel.closest('[data-slot="diff-after"]')
		expect(afterPane).toBeInTheDocument()
	})

	it('displays diff content correctly', () => {
		render(<DiffPane before="hello world" after="hello universe" />)
		expect(screen.getByText(/hello world/)).toBeInTheDocument()
		expect(screen.getByText(/hello universe/)).toBeInTheDocument()
	})
})
