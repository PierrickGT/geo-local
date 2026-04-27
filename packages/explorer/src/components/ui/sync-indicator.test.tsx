import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SyncIndicator } from './sync-indicator'

describe('SyncIndicator', () => {
	it('renders green dot', () => {
		render(<SyncIndicator lastSync={new Date()} />)
		const dot = screen.getByTestId('sync-dot')
		expect(dot).toBeInTheDocument()
	})

	it('renders relative time text', () => {
		const now = new Date()
		render(<SyncIndicator lastSync={now} />)
		expect(screen.getByText(/synced/)).toBeInTheDocument()
	})

	it('uses monospace font for time text', () => {
		const now = new Date()
		render(<SyncIndicator lastSync={now} />)
		const text = screen.getByText(/synced/)
		expect(text.className).toContain('font-mono')
	})
})
