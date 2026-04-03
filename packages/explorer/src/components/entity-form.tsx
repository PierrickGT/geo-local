import { MinusIcon, PlusIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { Triple, ValueType } from '~/api/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { DESCRIPTION_PROPERTY_ID, NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropertyRow {
	propertyId: string
	valueType: ValueType
	value: string
	/** @internal stable key for React rendering; auto-assigned if missing */
	_key?: string
}

export interface EntityFormData {
	name: string
	description: string
	types: string
	properties: PropertyRow[]
}

export interface EntityFormProps {
	mode: 'create' | 'edit'
	initialData?: EntityFormData
	onSubmit: (data: EntityFormData) => void
	isSubmitting?: boolean
	submitLabel?: string
	className?: string
}

const VALUE_TYPES: ValueType[] = ['text', 'number', 'boolean', 'reference', 'json']

const SYSTEM_PROPERTY_IDS = new Set([NAME_PROPERTY_ID, DESCRIPTION_PROPERTY_ID, TYPES_PROPERTY_ID])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyRow(): PropertyRow {
	return { _key: crypto.randomUUID(), propertyId: '', valueType: 'text', value: '' }
}

function parseTypes(triple: Triple): string {
	const val = triple.value?.value
	if (typeof val === 'string') return val
	return Array.isArray(val) ? val.join(', ') : String(val ?? '')
}

/**
 * Map system triples from the entity's triple array to form fields,
 * and collect non-system triples as custom property rows.
 */
export function triplesToFormData(triples: Triple[]): EntityFormData {
	let name = ''
	let description = ''
	let types = ''
	const properties: PropertyRow[] = []

	for (const triple of triples) {
		if (triple.propertyId === NAME_PROPERTY_ID) {
			name = String(triple.value?.value ?? '')
		} else if (triple.propertyId === DESCRIPTION_PROPERTY_ID) {
			description = String(triple.value?.value ?? '')
		} else if (triple.propertyId === TYPES_PROPERTY_ID) {
			types = parseTypes(triple)
		} else if (!SYSTEM_PROPERTY_IDS.has(triple.propertyId)) {
			properties.push({
				_key: crypto.randomUUID(),
				propertyId: triple.propertyId,
				valueType: triple.valueType,
				value: String(triple.value?.value ?? ''),
			})
		}
	}

	return { name, description, types, properties }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityForm({
	mode,
	initialData,
	onSubmit,
	isSubmitting = false,
	submitLabel,
	className,
}: EntityFormProps) {
	const [name, setName] = useState(initialData?.name ?? '')
	const [description, setDescription] = useState(initialData?.description ?? '')
	const [types, setTypes] = useState(initialData?.types ?? '')
	const [properties, setProperties] = useState<PropertyRow[]>(() =>
		(initialData?.properties ?? []).map((p) => ({ ...p, _key: p._key ?? crypto.randomUUID() })),
	)
	const [nameError, setNameError] = useState('')

	const defaultSubmitLabel = mode === 'create' ? 'Create Entity' : 'Save Changes'

	const isDirty = useMemo(() => {
		if (!initialData) return true

		if (name !== initialData.name) return true
		if (description !== initialData.description) return true
		if (types !== initialData.types) return true
		if (properties.length !== initialData.properties.length) return true

		for (let i = 0; i < properties.length; i++) {
			const curr = properties[i]
			const init = initialData.properties[i]
			if (curr.propertyId !== init.propertyId) return true
			if (curr.valueType !== init.valueType) return true
			if (curr.value !== init.value) return true
		}

		return false
	}, [name, description, types, properties, initialData])

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			setNameError('')

			if (!name.trim()) {
				setNameError('Name is required')
				return
			}

			onSubmit({ name: name.trim(), description, types, properties })
		},
		[name, description, types, properties, onSubmit],
	)

	const addProperty = useCallback(() => {
		setProperties((prev) => [...prev, emptyRow()])
	}, [])

	const removeProperty = useCallback((index: number) => {
		setProperties((prev) => prev.filter((_, i) => i !== index))
	}, [])

	const updateProperty = useCallback((index: number, field: keyof PropertyRow, value: string) => {
		setProperties((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
	}, [])

	const canSubmit = mode === 'create' || isDirty

	return (
		<form onSubmit={handleSubmit} className={`space-y-6 ${className ?? ''}`}>
			{/* Name */}
			<div className="space-y-2">
				<Label htmlFor="entity-name">
					Name <span className="text-destructive">*</span>
				</Label>
				<Input
					id="entity-name"
					value={name}
					onChange={(e) => {
						setName(e.target.value)
						if (nameError) setNameError('')
					}}
					placeholder="Entity name"
					aria-required="true"
					aria-invalid={!!nameError}
					data-testid="entity-name-input"
				/>
				{nameError && (
					<p className="text-sm text-destructive" data-testid="name-error">
						{nameError}
					</p>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="entity-description">Description</Label>
				<Textarea
					id="entity-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Optional description"
					data-testid="entity-description-input"
				/>
			</div>

			{/* Types */}
			<div className="space-y-2">
				<Label htmlFor="entity-types">Types</Label>
				<Input
					id="entity-types"
					value={types}
					onChange={(e) => setTypes(e.target.value)}
					placeholder="Comma or newline-separated types"
					data-testid="entity-types-input"
				/>
			</div>

			{/* Dynamic Properties */}
			<fieldset className="space-y-4">
				<legend className="text-sm font-medium">Properties</legend>

				{properties.length > 0 && (
					<div className="space-y-3">
						{properties.map((row, index) => (
							<div
								key={row._key}
								className="flex items-start gap-2"
								data-testid={`property-row-${index}`}
							>
								<div className="flex-1 space-y-1">
									<Input
										placeholder="Property ID"
										value={row.propertyId}
										onChange={(e) => updateProperty(index, 'propertyId', e.target.value)}
										data-testid={`property-id-${index}`}
									/>
								</div>
								<div className="w-36">
									<Select
										value={row.valueType}
										onValueChange={(val) => updateProperty(index, 'valueType', val)}
									>
										<SelectTrigger className="w-full" data-testid={`property-type-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{VALUE_TYPES.map((vt) => (
												<SelectItem key={vt} value={vt}>
													{vt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex-1 space-y-1">
									<Input
										placeholder="Value"
										value={row.value}
										onChange={(e) => updateProperty(index, 'value', e.target.value)}
										data-testid={`property-value-${index}`}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeProperty(index)}
									aria-label={`Remove property ${index + 1}`}
									data-testid={`remove-property-${index}`}
								>
									<MinusIcon className="size-4" />
								</Button>
							</div>
						))}
					</div>
				)}

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addProperty}
					data-testid="add-property"
				>
					<PlusIcon className="size-4" />
					Add Property
				</Button>
			</fieldset>

			{/* No-op message for edit mode */}
			{mode === 'edit' && !isDirty && (
				<p className="text-sm text-muted-foreground" data-testid="no-changes-message">
					No changes to save.
				</p>
			)}

			{/* Submit */}
			<Button type="submit" disabled={isSubmitting || !canSubmit} data-testid="entity-submit">
				{isSubmitting ? 'Saving...' : (submitLabel ?? defaultSubmitLabel)}
			</Button>
		</form>
	)
}
