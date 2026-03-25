import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Relation } from '~/api/types'
import { usePropertyNames } from '~/hooks/use-entities'
import { formatPropertyId } from '~/lib/constants'

interface RelationsPanelProps {
	outgoing: Relation[]
	incoming: Relation[]
	className?: string
}

type Direction = 'outgoing' | 'incoming'

interface UnifiedRelation extends Relation {
	direction: Direction
}

/**
 * Truncates an entity ID for display.
 */
function truncateEntityId(id: string, maxLength = 12): string {
	return id.length > maxLength ? `${id.slice(0, maxLength)}...` : id
}

/**
 * Arrow icon component showing relation direction.
 * Outgoing: arrow points right (→)
 * Incoming: arrow points left (←)
 */
function DirectionArrow({ direction }: { direction: Direction }) {
	return (
		<svg
			className={`w-4 h-4 text-gray-400 flex-shrink-0 ${direction === 'incoming' ? 'rotate-180' : ''}`}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			role="img"
			aria-label={direction === 'outgoing' ? 'points to' : 'pointed from'}
		>
			<title>{direction === 'outgoing' ? 'points to' : 'pointed from'}</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M13 7l5 5m0 0l-5 5m5-5H6"
			/>
		</svg>
	)
}

/**
 * Relations panel showing all relations in a unified list.
 * Each relation shows the relation type, direction indicator, and linked entity.
 * Clicking a linked entity navigates to its detail page.
 */
export function RelationsPanel({ outgoing, incoming, className = '' }: RelationsPanelProps) {
	const navigate = useNavigate()

	// Combine outgoing and incoming relations with direction marker
	const allRelations: UnifiedRelation[] = useMemo(
		() => [
			...outgoing.map((r) => ({ ...r, direction: 'outgoing' as const })),
			...incoming.map((r) => ({ ...r, direction: 'incoming' as const })),
		],
		[outgoing, incoming],
	)

	// Extract unique relation type IDs for name resolution
	const relationTypeIds = useMemo(
		() => [...new Set(allRelations.map((r) => r.relationType))],
		[allRelations],
	)

	// Extract unique linked entity IDs for name resolution
	const linkedEntityIds = useMemo(() => {
		const ids = allRelations.map((r) => (r.direction === 'outgoing' ? r.toId : r.fromId))
		return [...new Set(ids)]
	}, [allRelations])

	// Resolve property names for relation types
	const { names: propertyNames } = usePropertyNames(relationTypeIds)

	// Resolve names for linked entities
	const { names: linkedEntityNames } = usePropertyNames(linkedEntityIds)

	const handleEntityClick = (entityId: string) => {
		navigate(`/entities/${encodeURIComponent(entityId)}`)
	}

	const totalCount = allRelations.length

	return (
		<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
			{/* Header */}
			<div className="px-4 py-3 border-b border-gray-200">
				<h2 className="text-lg font-medium text-gray-900">Relations ({totalCount})</h2>
			</div>

			{/* Relations list */}
			<div className="divide-y divide-gray-100">
				{allRelations.length === 0 ? (
					<div className="px-4 py-8 text-center text-gray-500">
						No relations found for this entity.
					</div>
				) : (
					allRelations.map((relation, index) => {
						const linkedEntityId =
							relation.direction === 'outgoing' ? relation.toId : relation.fromId
						// Use resolved name if available, fallback to formatted ID
						const resolvedName = propertyNames.get(relation.relationType)
						const displayName = resolvedName ?? formatPropertyId(relation.relationType)
						// Resolve linked entity name
						const linkedEntityName = linkedEntityNames.get(linkedEntityId)

						return (
							<div
								key={`${relation.fromId}-${relation.toId}-${relation.relationType}-${index}`}
								className="px-4 py-3 hover:bg-gray-50"
							>
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<span className="font-mono text-sm text-gray-700" title={relation.relationType}>
											{displayName}
										</span>
										<DirectionArrow direction={relation.direction} />
										<a
											href={`/entities/${encodeURIComponent(linkedEntityId)}`}
											onClick={(e) => {
												e.preventDefault()
												handleEntityClick(linkedEntityId)
											}}
											className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm"
											title={linkedEntityId}
										>
											{linkedEntityName ?? truncateEntityId(linkedEntityId)}
										</a>
									</div>
								</div>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
