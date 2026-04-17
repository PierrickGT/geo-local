import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Triple, ValueType } from '~/api/types'
import { usePropertyNames } from '~/hooks/use-entities'
import { formatPropertyId } from '~/lib/constants'

/**
 * Truncates an entity ID for display.
 */
function truncateEntityId(id: string, maxLength = 16): string {
	return id.length > maxLength ? `${id.slice(0, maxLength)}...` : id
}

interface TriplesPanelProps {
	triples: Triple[]
	className?: string
}

/**
 * Extracts the raw value from a triple.
 * Handles both wrapped values ({ value: "..." }) and raw values ("...").
 * Date values from the API may be stored as plain strings instead of wrapped objects.
 */
function getRawValue(triple: Triple): unknown {
	const v = triple.value
	if (typeof v === 'object' && v !== null && 'value' in v) {
		return v.value
	}
	return v
}

/**
 * Formats a value based on its type for display.
 */
function formatValue(value: unknown, valueType: ValueType): string {
	if (value == null) return '—'
	switch (valueType) {
		case 'text':
			return String(value)
		case 'number':
			return typeof value === 'number' ? value.toLocaleString() : String(value)
		case 'boolean':
			return value ? 'true' : 'false'
		case 'date':
			try {
				return new Date(String(value)).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				})
			} catch {
				return String(value)
			}
		case 'reference':
			return String(value)
		case 'json':
			return JSON.stringify(value)
		default:
			return String(value)
	}
}

/**
 * Badge component for displaying value type.
 */
function ValueTypeBadge({ type }: { type: string }) {
	const colors: Record<string, string> = {
		text: 'bg-blue-100 text-blue-800',
		number: 'bg-indigo-100 text-indigo-900',
		boolean: 'bg-yellow-100 text-yellow-800',
		reference: 'bg-green-100 text-green-800',
		json: 'bg-gray-100 text-gray-800',
		date: 'bg-orange-100 text-orange-800',
		integer: 'bg-indigo-100 text-indigo-900',
		float: 'bg-violet-100 text-violet-900',
		decimal: 'bg-violet-100 text-violet-900',
		time: 'bg-orange-100 text-orange-800',
		datetime: 'bg-orange-100 text-orange-800',
		schedule: 'bg-orange-100 text-orange-800',
		bytes: 'bg-gray-100 text-gray-700',
		point: 'bg-teal-100 text-teal-800',
		rect: 'bg-teal-100 text-teal-800',
		embedding: 'bg-cyan-100 text-cyan-800',
	}

	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] ?? 'bg-gray-100 text-gray-700'}`}
		>
			{type}
		</span>
	)
}

/**
 * Panel displaying all triples (property values) for an entity.
 * Shows property ID, value type, and value for each triple.
 */
export function TriplesPanel({ triples, className = '' }: TriplesPanelProps) {
	const navigate = useNavigate()

	// Extract unique property IDs for name resolution
	const propertyIds = useMemo(() => [...new Set(triples.map((t) => t.propertyId))], [triples])
	const { names: propertyNames } = usePropertyNames(propertyIds)

	// Resolve reference entity IDs to their names
	const referenceIds = useMemo(
		() => [
			...new Set(
				triples
					.filter((t) => t.valueType === 'reference' && getRawValue(t) != null)
					.map((t) => String(getRawValue(t))),
			),
		],
		[triples],
	)
	const { names: referenceNames } = usePropertyNames(referenceIds)

	if (triples.length === 0) {
		return (
			<div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
				<h2 className="text-lg font-medium text-gray-900 mb-4">Properties</h2>
				<p className="text-gray-500 text-center py-4">No properties found for this entity.</p>
			</div>
		)
	}

	return (
		<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
			<div className="px-4 py-3 border-b border-gray-200">
				<h2 className="text-lg font-medium text-gray-900">Properties</h2>
			</div>
			<div className="divide-y divide-gray-100">
				{triples.map((triple, index) => {
					const rawValue = getRawValue(triple)
					const displayValue = formatValue(rawValue, triple.valueType)
					const isReference = triple.valueType === 'reference'
					const resolvedName = propertyNames.get(triple.propertyId)
					const displayName = resolvedName ?? formatPropertyId(triple.propertyId)

					return (
						<div key={`${triple.propertyId}-${index}`} className="px-4 py-3 hover:bg-gray-50">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-sm font-medium text-gray-900" title={triple.propertyId}>
											{displayName}
										</span>
										<ValueTypeBadge type={triple.valueType} />
									</div>
									{isReference && rawValue != null ? (
										<a
											href={`/entities/${encodeURIComponent(String(rawValue))}`}
											onClick={(e) => {
												e.preventDefault()
												navigate(`/entities/${encodeURIComponent(String(rawValue))}`)
											}}
											className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
											title={String(rawValue)}
										>
											{referenceNames.get(String(rawValue)) ?? truncateEntityId(String(rawValue))}
										</a>
									) : (
										<p className="text-sm text-gray-900 break-all" title={displayValue}>
											{displayValue.length > 200
												? `${displayValue.slice(0, 200)}...`
												: displayValue}
										</p>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
