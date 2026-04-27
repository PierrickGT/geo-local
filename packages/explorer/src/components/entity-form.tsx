import { useCallback, useMemo, useState } from 'react'
import type { Triple, ValueType } from '~/api/types'
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
	/** Entity ID for edit mode — displayed in the disabled ID field */
	entityId?: string
	onSubmit: (data: EntityFormData) => void
	/** Custom cancel handler — defaults to window.history.back() */
	onCancel?: () => void
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
// Form primitives (Graphite-styled)
// ---------------------------------------------------------------------------

const formInputClass =
	'w-full px-[10px] py-[6px] border border-border rounded-[6px] text-[13px] bg-card text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/20'

function FormSection({
	title,
	subtitle,
	children,
	isLast,
}: {
	title: string
	subtitle?: string
	children: React.ReactNode
	isLast?: boolean
}) {
	return (
		<div
			className="grid grid-cols-[220px_1fr] gap-6 px-[18px] py-[18px]"
			style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)' }}
		>
			<div>
				<div className="text-[13.5px] font-medium text-foreground">{title}</div>
				{subtitle && (
					<div className="text-[12px] text-muted-foreground mt-[3px] leading-snug">{subtitle}</div>
				)}
			</div>
			<div>{children}</div>
		</div>
	)
}

function Field({
	label,
	required,
	hint,
	htmlFor,
	children,
}: {
	label: string
	required?: boolean
	hint?: string
	htmlFor?: string
	children: React.ReactNode
}) {
	return (
		<div className="mb-[14px] last:mb-0">
			<div className="flex items-baseline gap-[6px] mb-[6px]">
				<label htmlFor={htmlFor} className="text-[12px] font-medium text-[#3f3f46]">
					{label}
					{required && <span className="text-destructive ml-[2px]">*</span>}
				</label>
				{hint && <span className="text-[11px] text-[#a1a1aa]">· {hint}</span>}
			</div>
			{children}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityForm({
	mode,
	initialData,
	entityId,
	onSubmit,
	onCancel,
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

	const defaultSubmitLabel = mode === 'create' ? 'Create entity' : 'Save changes'

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

	// Types chips from comma-separated input
	const typeChips = useMemo(
		() =>
			types
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		[types],
	)

	return (
		<form onSubmit={handleSubmit} className={className}>
			<div className="bg-card border border-border rounded-lg overflow-hidden">
				{/* Identity section */}
				<FormSection title="Identity" subtitle="How this entity is named and identified">
					<Field label="Name" required htmlFor="entity-name">
						<input
							id="entity-name"
							value={name}
							onChange={(e) => {
								setName(e.target.value)
								if (nameError) setNameError('')
							}}
							placeholder="e.g. Anesthesia Base Units"
							aria-required="true"
							aria-invalid={!!nameError}
							data-testid="entity-name-input"
							className={formInputClass}
						/>
						{nameError && (
							<p className="text-[12px] text-destructive mt-1" data-testid="name-error">
								{nameError}
							</p>
						)}
					</Field>

					<Field
						label="Description"
						hint="Markdown supported · plain text by default"
						htmlFor="entity-description"
					>
						<textarea
							id="entity-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Optional description"
							rows={3}
							data-testid="entity-description-input"
							className={`${formInputClass} resize-vertical p-[8px_10px] leading-relaxed`}
						/>
					</Field>

					{mode === 'edit' && initialData && (
						<Field label="ID">
							<div
								className="flex items-center gap-2 px-[10px] py-[6px] bg-background border border-border rounded-[6px]"
								data-testid="entity-id-display"
							>
								<span className="font-mono text-[12px] text-muted-foreground flex-1 overflow-hidden text-ellipsis">
									{entityId ?? ''}
								</span>
								<span className="text-[11px] text-[#a1a1aa]">generated · immutable</span>
							</div>
						</Field>
					)}
				</FormSection>

				{/* Types section */}
				<FormSection title="Types" subtitle="Which type entities classify this one">
					<Field label="Types" htmlFor="entity-types">
						<input
							id="entity-types"
							value={types}
							onChange={(e) => setTypes(e.target.value)}
							placeholder="Type, Property (comma-separated)"
							data-testid="entity-types-input"
							className={formInputClass}
						/>
						{typeChips.length > 0 && (
							<div className="flex flex-wrap gap-[6px] mt-2">
								{typeChips.map((t) => (
									<span
										key={t}
										className="inline-flex items-center gap-[6px] px-[9px] py-[3px] bg-[#eef2ff] text-accent text-[11.5px] rounded-[4px] font-medium"
									>
										{t}
										<button
											type="button"
											className="border-none bg-transparent text-accent cursor-pointer p-0 w-[14px] h-[14px] grid place-items-center rounded-full"
											onClick={() => {
												const newTypes = typeChips.filter((c) => c !== t).join(', ')
												setTypes(newTypes)
											}}
										>
											×
										</button>
									</span>
								))}
								<button
									type="button"
									className="border border-dashed border-border bg-transparent text-muted-foreground px-2 py-[2px] rounded-[4px] text-[11.5px] cursor-pointer"
									data-testid="suggest-types"
								>
									+ Suggest
								</button>
							</div>
						)}
						{typeChips.length === 0 && (
							<div className="flex gap-[6px] mt-2">
								<button
									type="button"
									className="border border-dashed border-border bg-transparent text-muted-foreground px-2 py-[2px] rounded-[4px] text-[11.5px] cursor-pointer"
									data-testid="suggest-types"
								>
									+ Suggest
								</button>
							</div>
						)}
					</Field>
				</FormSection>

				{/* Properties section */}
				<FormSection
					title="Properties"
					subtitle="Typed key-value pairs attached to this entity"
					isLast
				>
					{properties.length === 0 && (
						<div
							className="py-[14px] px-4 border border-dashed border-border rounded-[6px] text-[12.5px] text-muted-foreground text-center"
							data-testid="no-properties-message"
						>
							No properties yet. Add one to define data on this entity.
						</div>
					)}
					{properties.map((row, index) => (
						<div
							key={row._key}
							className="grid grid-cols-[1.2fr_110px_1.6fr_32px] gap-2 mb-2 items-center"
							data-testid={`property-row-${index}`}
						>
							<input
								value={row.propertyId}
								onChange={(e) => updateProperty(index, 'propertyId', e.target.value)}
								placeholder="Property ID or name"
								className={`${formInputClass} font-mono text-[12px]`}
								data-testid={`property-id-${index}`}
							/>
							<select
								value={row.valueType}
								onChange={(e) => updateProperty(index, 'valueType', e.target.value)}
								className={formInputClass}
								data-testid={`property-type-${index}`}
							>
								{VALUE_TYPES.map((vt) => (
									<option key={vt} value={vt}>
										{vt}
									</option>
								))}
							</select>
							<input
								value={row.value}
								onChange={(e) => updateProperty(index, 'value', e.target.value)}
								placeholder="Value"
								className={formInputClass}
								data-testid={`property-value-${index}`}
							/>
							<button
								type="button"
								onClick={() => removeProperty(index)}
								aria-label={`Remove property ${index + 1}`}
								data-testid={`remove-property-${index}`}
								className="w-7 h-7 border border-border bg-card text-muted-foreground rounded-[6px] cursor-pointer grid place-items-center hover:bg-hover transition-colors"
							>
								<svg width="10" height="10" viewBox="0 0 10 10" role="img" aria-label="Remove">
									<path d="M2 5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
								</svg>
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={addProperty}
						data-testid="add-property"
						className="border border-dashed border-border bg-transparent text-[#3f3f46] px-3 py-[6px] rounded-[6px] text-[12.5px] cursor-pointer inline-flex items-center gap-[6px] mt-1"
					>
						<svg width="10" height="10" viewBox="0 0 10 10" role="img" aria-label="Plus">
							<path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" />
						</svg>
						Add property
					</button>
				</FormSection>
			</div>

			{/* Sticky footer — staging indicator + actions */}
			<div
				className="flex items-center gap-[10px] mt-[14px] px-[14px] py-[10px] bg-card border border-border rounded-lg sticky bottom-0"
				data-testid="form-footer"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					className={name.trim() ? 'text-accent' : 'text-[#a1a1aa]'}
					role="img"
					aria-label="Staging status"
				>
					<circle cx="7" cy="7" r="5.5" stroke="currentColor" fill="none" strokeWidth="1.2" />
					<path
						d="M7 4v3l2 1.5"
						stroke="currentColor"
						strokeWidth="1.2"
						fill="none"
						strokeLinecap="round"
					/>
				</svg>
				<span className="text-[12.5px] text-[#3f3f46]" data-testid="staging-text">
					{mode === 'edit' && !isDirty ? (
						'No changes to save.'
					) : name.trim() ? (
						<>
							Will stage <span className="font-medium">1 create</span> to the Edits queue
						</>
					) : (
						'Nothing staged yet'
					)}
				</span>

				{/* No-op message for edit mode */}
				{mode === 'edit' && !isDirty && (
					<span className="text-[12px] text-muted-foreground" data-testid="no-changes-message">
						No changes to save.
					</span>
				)}

				<div className="flex-1" />
				<button
					type="button"
					className="border border-border bg-card text-[#3f3f46] px-[14px] py-[6px] rounded-[6px] text-[12.5px] cursor-pointer hover:bg-hover transition-colors"
					onClick={onCancel ?? (() => window.history.back())}
					data-testid="entity-cancel"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting || !canSubmit}
					data-testid="entity-submit"
					className="px-[14px] py-[6px] rounded-[6px] text-[12.5px] cursor-pointer font-medium border-none disabled:cursor-not-allowed disabled:bg-line-soft disabled:text-[#a1a1aa] bg-foreground text-background"
				>
					{isSubmitting ? 'Saving...' : (submitLabel ?? defaultSubmitLabel)}
				</button>
			</div>
		</form>
	)
}
