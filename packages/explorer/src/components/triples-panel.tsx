import type { Triple, ValueType } from '~/api/types'
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
 * Formats a value based on its type for display.
 */
function formatValue(value: unknown, valueType: ValueType): string {
	switch (valueType) {
		case 'text':
			return String(value)
		case 'number':
			return typeof value === 'number' ? value.toLocaleString() : String(value)
		case 'boolean':
			return value ? 'true' : 'false'
		case 'reference':
			return String(value) // Entity ID
		case 'json':
			return JSON.stringify(value)
		default:
			return String(value)
	}
}

/**
 * Badge component for displaying value type.
 */
function ValueTypeBadge({ type }: { type: ValueType }) {
	const colors: Record<ValueType, string> = {
		text: 'bg-blue-100 text-blue-800',
		number: 'bg-purple-100 text-purple-800',
		boolean: 'bg-yellow-100 text-yellow-800',
		reference: 'bg-green-100 text-green-800',
		json: 'bg-gray-100 text-gray-800',
	}

	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type]}`}
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
					const displayValue = formatValue(triple.value.value, triple.valueType)
					const isReference = triple.valueType === 'reference'

					return (
						<div key={`${triple.propertyId}-${index}`} className="px-4 py-3 hover:bg-gray-50">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-mono text-sm text-gray-700" title={triple.propertyId}>
											{formatPropertyId(triple.propertyId)}
										</span>
										<ValueTypeBadge type={triple.valueType} />
									</div>
									{isReference ? (
										<span className="font-mono text-sm text-green-700" title={displayValue}>
											{truncateEntityId(displayValue, 16)}
										</span>
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
