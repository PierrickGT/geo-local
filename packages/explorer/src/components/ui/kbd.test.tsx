import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Kbd } from './kbd'

describe('Kbd', () => {
	it('renders children as keyboard hint text', () => {
		render(<Kbd>⌘K</Kbd>)
		expect(screen.getByText('⌘K')).toBeInTheDocument()
	})

	it('applies monospace font class', () => {
		render(<Kbd>⌘K</Kbd>)
		const el = screen.getByText('⌘K')
		expect(el.className).toContain('font-mono')
	})

	it('renders as a span element with data-slot', () => {
		render(<Kbd>⌘K</Kbd>)
		const el = screen.getByText('⌘K')
		expect(el.tagName).toBe('SPAN')
		expect(el.dataset.slot).toBe('kbd')
	})

	it('applies border and compact padding', () => {
		render(<Kbd>⌘K</Kbd>)
		const el = screen.getByText('⌘K')
		expect(el.className).toContain('border')
		expect(el.className).toContain('px-')
	})
})
