import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Triple } from '~/api/types'
import { DESCRIPTION_PROPERTY_ID, NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'
import { EntityForm, type EntityFormData, triplesToFormData } from './entity-form'

// ---------------------------------------------------------------------------
// triplesToFormData helper
// ---------------------------------------------------------------------------

describe('triplesToFormData', () => {
	it('maps NAME triple to name field', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: NAME_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Test Entity' },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.name).toBe('Test Entity')
	})

	it('maps DESCRIPTION triple to description field', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: DESCRIPTION_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'A description' },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.description).toBe('A description')
	})

	it('maps TYPES triple to types field', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: TYPES_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Person,Org' },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.types).toBe('Person,Org')
	})

	it('maps non-system triples to properties array', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: NAME_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Test' },
				language: null,
			},
			{
				entityId: 'e1',
				propertyId: 'custom-prop-id',
				valueType: 'number',
				value: { value: 42 },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.properties).toHaveLength(1)
		expect(data.properties[0].propertyId).toBe('custom-prop-id')
		expect(data.properties[0].valueType).toBe('number')
		expect(data.properties[0].value).toBe('42')
		expect(data.properties[0]._key).toBeTypeOf('string')
	})

	it('excludes system property IDs from dynamic properties', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: NAME_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Test' },
				language: null,
			},
			{
				entityId: 'e1',
				propertyId: DESCRIPTION_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Desc' },
				language: null,
			},
			{
				entityId: 'e1',
				propertyId: TYPES_PROPERTY_ID,
				valueType: 'text',
				value: { value: 'Type' },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.properties).toHaveLength(0)
	})

	it('handles empty triples', () => {
		const data = triplesToFormData([])
		expect(data).toEqual({
			name: '',
			description: '',
			types: '',
			properties: [],
		})
	})

	it('handles array value in TYPES triple', () => {
		const triples: Triple[] = [
			{
				entityId: 'e1',
				propertyId: TYPES_PROPERTY_ID,
				valueType: 'text',
				value: { value: ['Person', 'Org'] },
				language: null,
			},
		]
		const data = triplesToFormData(triples)
		expect(data.types).toBe('Person, Org')
	})
})

// ---------------------------------------------------------------------------
// EntityForm — rendering
// ---------------------------------------------------------------------------

describe('EntityForm', () => {
	const defaultProps = {
		mode: 'create' as const,
		onSubmit: vi.fn(),
	}

	describe('create mode', () => {
		it('renders all form fields', () => {
			render(<EntityForm {...defaultProps} />)

			expect(screen.getByTestId('entity-name-input')).toBeInTheDocument()
			expect(screen.getByTestId('entity-description-input')).toBeInTheDocument()
			expect(screen.getByTestId('entity-types-input')).toBeInTheDocument()
			expect(screen.getByText('Properties')).toBeInTheDocument()
			expect(screen.getByTestId('entity-submit')).toBeInTheDocument()
		})

		it('renders empty fields by default', () => {
			render(<EntityForm {...defaultProps} />)

			expect(screen.getByTestId('entity-name-input')).toHaveValue('')
			expect(screen.getByTestId('entity-description-input')).toHaveValue('')
			expect(screen.getByTestId('entity-types-input')).toHaveValue('')
		})

		it('submit button is enabled and labeled "Create entity"', () => {
			render(<EntityForm {...defaultProps} />)

			const btn = screen.getByTestId('entity-submit')
			expect(btn).not.toBeDisabled()
			expect(btn).toHaveTextContent('Create entity')
		})

		it('disables submit when isSubmitting is true', () => {
			render(<EntityForm {...defaultProps} isSubmitting />)

			const btn = screen.getByTestId('entity-submit')
			expect(btn).toBeDisabled()
			expect(btn).toHaveTextContent('Saving...')
		})
	})

	describe('edit mode', () => {
		const initialData: EntityFormData = {
			name: 'Test Entity',
			description: 'A test',
			types: 'Person',
			properties: [{ propertyId: 'age', valueType: 'number', value: '25' }],
		}

		it('prefills fields from initialData', () => {
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			expect(screen.getByTestId('entity-name-input')).toHaveValue('Test Entity')
			expect(screen.getByTestId('entity-description-input')).toHaveValue('A test')
			expect(screen.getByTestId('entity-types-input')).toHaveValue('Person')
			expect(screen.getByTestId('property-id-0')).toHaveValue('age')
			expect(screen.getByTestId('property-value-0')).toHaveValue('25')
		})

		it('submit button is labeled "Save changes"', () => {
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			expect(screen.getByTestId('entity-submit')).toHaveTextContent('Save changes')
		})

		it('shows "No changes to save" when form is untouched', () => {
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			expect(screen.getByTestId('staging-text')).toHaveTextContent('No changes to save.')
		})

		it('disables submit when no changes detected', () => {
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			expect(screen.getByTestId('entity-submit')).toBeDisabled()
		})

		it('enables submit when name changes', async () => {
			const user = userEvent.setup()
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			await user.type(screen.getByTestId('entity-name-input'), 'X')
			expect(screen.getByTestId('entity-submit')).not.toBeDisabled()
			expect(screen.getByTestId('staging-text')).not.toHaveTextContent('No changes to save.')
		})

		it('system triples do not appear as dynamic property rows', () => {
			// initialData has only one custom property (age), no system props
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			// Only one property row should exist
			expect(screen.getByTestId('property-id-0')).toHaveValue('age')
			expect(screen.queryByTestId('property-id-1')).not.toBeInTheDocument()
		})
	})

	// ---------------------------------------------------------------------------
	// Validation
	// ---------------------------------------------------------------------------

	describe('validation', () => {
		it('shows error when name is empty on submit', async () => {
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} />)

			await user.click(screen.getByTestId('entity-submit'))
			expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required')
		})

		it('clears error when user types in name field', async () => {
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} />)

			// Trigger error
			await user.click(screen.getByTestId('entity-submit'))
			expect(screen.getByTestId('name-error')).toBeInTheDocument()

			// Type to clear error
			await user.type(screen.getByTestId('entity-name-input'), 'A')
			expect(screen.queryByTestId('name-error')).not.toBeInTheDocument()
		})

		it('blocks submission when name is empty', async () => {
			const onSubmit = vi.fn()
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} onSubmit={onSubmit} />)

			await user.click(screen.getByTestId('entity-submit'))
			expect(onSubmit).not.toHaveBeenCalled()
		})

		it('allows submission with name filled', async () => {
			const onSubmit = vi.fn()
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} onSubmit={onSubmit} />)

			await user.type(screen.getByTestId('entity-name-input'), 'My Entity')
			await user.click(screen.getByTestId('entity-submit'))
			expect(onSubmit).toHaveBeenCalledOnce()
		})
	})

	// ---------------------------------------------------------------------------
	// Dynamic properties
	// ---------------------------------------------------------------------------

	describe('dynamic properties', () => {
		it('"Add Property" button adds empty row', async () => {
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} />)

			expect(screen.queryByTestId('property-row-0')).not.toBeInTheDocument()

			await user.click(screen.getByTestId('add-property'))

			expect(screen.getByTestId('property-row-0')).toBeInTheDocument()
			expect(screen.getByTestId('property-id-0')).toHaveValue('')
			expect(screen.getByTestId('property-value-0')).toHaveValue('')
		})

		it('remove button removes specific row', async () => {
			const user = userEvent.setup()
			const initialData: EntityFormData = {
				name: 'Test',
				description: '',
				types: '',
				properties: [
					{ propertyId: 'a', valueType: 'text', value: '1' },
					{ propertyId: 'b', valueType: 'number', value: '2' },
				],
			}
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			expect(screen.getByTestId('property-id-0')).toHaveValue('a')
			expect(screen.getByTestId('property-id-1')).toHaveValue('b')

			await user.click(screen.getByTestId('remove-property-0'))

			// Second row shifts to index 0
			expect(screen.getByTestId('property-id-0')).toHaveValue('b')
			expect(screen.queryByTestId('property-id-1')).not.toBeInTheDocument()
		})

		it('adding does not clear existing rows', async () => {
			const user = userEvent.setup()
			const initialData: EntityFormData = {
				name: 'Test',
				description: '',
				types: '',
				properties: [{ propertyId: 'existing', valueType: 'text', value: 'val' }],
			}
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			await user.click(screen.getByTestId('add-property'))

			expect(screen.getByTestId('property-id-0')).toHaveValue('existing')
			expect(screen.getByTestId('property-id-1')).toHaveValue('')
		})

		it('removing does not affect other rows', async () => {
			const user = userEvent.setup()
			const initialData: EntityFormData = {
				name: 'Test',
				description: '',
				types: '',
				properties: [
					{ propertyId: 'keep', valueType: 'text', value: 'v1' },
					{ propertyId: 'remove', valueType: 'number', value: '2' },
					{ propertyId: 'also-keep', valueType: 'boolean', value: 'true' },
				],
			}
			render(<EntityForm mode="edit" initialData={initialData} onSubmit={vi.fn()} />)

			await user.click(screen.getByTestId('remove-property-1'))

			expect(screen.getByTestId('property-id-0')).toHaveValue('keep')
			expect(screen.getByTestId('property-id-1')).toHaveValue('also-keep')
			expect(screen.queryByTestId('property-id-2')).not.toBeInTheDocument()
		})

		it('can type in property row fields', async () => {
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} />)

			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-id-0'), 'myProp')
			await user.type(screen.getByTestId('property-value-0'), 'myVal')

			expect(screen.getByTestId('property-id-0')).toHaveValue('myProp')
			expect(screen.getByTestId('property-value-0')).toHaveValue('myVal')
		})

		it('calls onSubmit with correct data including properties', async () => {
			const onSubmit = vi.fn()
			const user = userEvent.setup()
			render(<EntityForm {...defaultProps} onSubmit={onSubmit} />)

			await user.type(screen.getByTestId('entity-name-input'), 'Test')
			await user.type(screen.getByTestId('entity-description-input'), 'Desc')
			await user.type(screen.getByTestId('entity-types-input'), 'TypeA')
			await user.click(screen.getByTestId('add-property'))
			await user.type(screen.getByTestId('property-id-0'), 'color')
			await user.type(screen.getByTestId('property-value-0'), 'blue')

			await user.click(screen.getByTestId('entity-submit'))

			expect(onSubmit).toHaveBeenCalledWith({
				name: 'Test',
				description: 'Desc',
				types: 'TypeA',
				properties: [
					{ _key: expect.any(String), propertyId: 'color', valueType: 'text', value: 'blue' },
				],
			})
		})

		it('form data is preserved on submission error (onSubmit does not clear form)', async () => {
			const onSubmit = vi.fn()
			const user = userEvent.setup()

			render(<EntityForm {...defaultProps} onSubmit={onSubmit} />)

			await user.type(screen.getByTestId('entity-name-input'), 'My Entity')
			await user.type(screen.getByTestId('entity-description-input'), 'Some desc')

			// Submit the form — data should remain in inputs
			await user.click(screen.getByTestId('entity-submit'))

			expect(onSubmit).toHaveBeenCalledOnce()
			expect(screen.getByTestId('entity-name-input')).toHaveValue('My Entity')
			expect(screen.getByTestId('entity-description-input')).toHaveValue('Some desc')
		})
	})

	// ---------------------------------------------------------------------------
	// Custom submit label
	// ---------------------------------------------------------------------------

	describe('submit label', () => {
		it('uses custom submit label when provided', () => {
			render(<EntityForm {...defaultProps} submitLabel="Custom Label" />)
			expect(screen.getByTestId('entity-submit')).toHaveTextContent('Custom Label')
		})
	})
})
