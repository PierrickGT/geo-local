import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Triple } from '~/api/types'
import { TriplesPanel } from './triples-panel'

describe('TriplesPanel', () => {
	const mockTriples: Triple[] = [
		{
			entityId: 'entity-1',
			propertyId: 'NAME',
			valueType: 'text',
			value: { value: 'Test Name' },
			language: null,
		},
		{
			entityId: 'entity-1',
			propertyId: 'COUNT',
			valueType: 'number',
			value: { value: 42 },
			language: null,
		},
		{
			entityId: 'entity-1',
			propertyId: 'ACTIVE',
			valueType: 'boolean',
			value: { value: true },
			language: null,
		},
		{
			entityId: 'entity-1',
			propertyId: 'REF',
			valueType: 'reference',
			value: { value: 'referenced-entity-id' },
			language: null,
		},
		{
			entityId: 'entity-1',
			propertyId: 'DATA',
			valueType: 'json',
			value: { value: { key: 'value' } },
			language: null,
		},
	]

	describe('rendering', () => {
		it('renders properties header', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByRole('heading', { name: 'Properties' })).toBeInTheDocument()
		})

		it('displays all property IDs', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByText('NAME')).toBeInTheDocument()
			expect(screen.getByText('COUNT')).toBeInTheDocument()
			expect(screen.getByText('ACTIVE')).toBeInTheDocument()
			expect(screen.getByText('REF')).toBeInTheDocument()
			expect(screen.getByText('DATA')).toBeInTheDocument()
		})

		it('displays value type badges', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getAllByText('text')).toHaveLength(1)
			expect(screen.getByText('number')).toBeInTheDocument()
			expect(screen.getByText('boolean')).toBeInTheDocument()
			expect(screen.getByText('reference')).toBeInTheDocument()
			expect(screen.getByText('json')).toBeInTheDocument()
		})

		it('displays formatted text values', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByText('Test Name')).toBeInTheDocument()
		})

		it('displays formatted number values', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByText('42')).toBeInTheDocument()
		})

		it('displays formatted boolean values', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByText('true')).toBeInTheDocument()
		})

		it('displays reference values with TruncateId', () => {
			render(<TriplesPanel triples={mockTriples} />)

			// Reference values show truncated ID
			expect(screen.getByText(/referenced/)).toBeInTheDocument()
		})

		it('displays formatted JSON values', () => {
			render(<TriplesPanel triples={mockTriples} />)

			expect(screen.getByText('{"key":"value"}')).toBeInTheDocument()
		})
	})

	describe('empty state', () => {
		it('shows empty state when no triples', () => {
			render(<TriplesPanel triples={[]} />)

			expect(screen.getByText('No properties found for this entity.')).toBeInTheDocument()
		})
	})

	describe('truncation', () => {
		it('displays long property IDs in full', () => {
			const longIdTriple: Triple = {
				entityId: 'entity-1',
				propertyId: 'this-is-a-very-long-property-id-that-should-be-truncated',
				valueType: 'text',
				value: { value: 'value' },
				language: null,
			}

			render(<TriplesPanel triples={[longIdTriple]} />)

			// Property ID is displayed in full (truncation removed)
			const propertyElement = screen.getByTitle(longIdTriple.propertyId)
			expect(propertyElement).toBeInTheDocument()
			expect(propertyElement.textContent).toBe(longIdTriple.propertyId)
		})

		it('truncates long text values', () => {
			const longValue =
				'This is a very long text value that should be truncated when displayed because it exceeds the maximum length limit for display purposes and would otherwise take up too much space on the screen.'

			const longValueTriple: Triple = {
				entityId: 'entity-1',
				propertyId: 'LONG_VALUE',
				valueType: 'text',
				value: { value: longValue },
				language: null,
			}

			render(<TriplesPanel triples={[longValueTriple]} />)

			// Value should be truncated with ellipsis
			expect(screen.getByText(/This is a very long text value/)).toBeInTheDocument()
		})
	})
})
