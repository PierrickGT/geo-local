import { useParams } from 'react-router'
import type { EntityStatus, Relation } from '~/api/types'
import { RelationsPanel } from '~/components/relations-panel'
import { TriplesPanel } from '~/components/triples-panel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { TruncateId } from '~/components/ui/truncate-id'
import { useEntity } from '~/hooks/use-entities'
import { NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'

/**
 * Status badge component for displaying entity status.
 */
function StatusBadge({ status }: { status: EntityStatus }) {
	const variant = status === 'alive' ? 'success' : 'destructive'

	return <Badge variant={variant}>{status}</Badge>
}

/**
 * Entity type badge for displaying the entity's category (Type, Property, or Entity).
 * An entity is a "Type" if it has incoming TYPE relations (other entities pointing to it).
 */
function EntityTypeBadge({ type }: { type: 'type' | 'property' | 'entity' }) {
	const variant = type === 'type' ? 'info' : type === 'property' ? 'secondary' : 'outline'

	return <Badge variant={variant}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
}

/**
 * Determines the entity type based on incoming relations.
 * - "Type": if there are incoming TYPE relations (other entities use this as their type)
 * - "Property": reserved for future detection (currently unused)
 * - "Entity": default for regular entities
 */
function getEntityType(incoming: Relation[]): 'type' | 'property' | 'entity' {
	const hasIncomingTypeRelations = incoming.some(
		(relation) => relation.relationType === TYPES_PROPERTY_ID,
	)
	if (hasIncomingTypeRelations) {
		return 'type'
	}
	return 'entity'
}

/**
 * Formats an ISO date string to a human-readable format.
 */
function formatDate(isoString: string): string {
	const date = new Date(isoString)
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * Entity detail page showing entity header, triples panel, and relations panel.
 * Handles loading, not found, and error states.
 */
export function EntityPage() {
	const { id } = useParams<{ id: string }>()
	const { entity, isLoading, isError, error } = useEntity(id ?? '')

	// Loading state
	if (isLoading) {
		return (
			<div className="p-6">
				<Card>
					<CardContent className="py-8">
						<div className="space-y-4">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-64" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Error state (including 404 not found)
	if (isError || !entity) {
		const isNotFound = error && 'status' in error && (error as { status: number }).status === 404

		return (
			<div className="p-6">
				<Card>
					<CardContent className="py-8">
						<div className="text-center">
							{isNotFound ? (
								<>
									<svg
										className="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										role="img"
										aria-label="Entity not found"
									>
										<title>Entity not found</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">Entity not found</h3>
									<p className="mt-1 text-sm text-gray-500">
										The entity with ID "{id}" does not exist.
									</p>
								</>
							) : (
								<>
									<svg
										className="mx-auto h-12 w-12 text-red-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										role="img"
										aria-label="Error"
									>
										<title>Error</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load entity</h3>
									<p className="mt-1 text-sm text-gray-500">
										{error?.message || 'An unexpected error occurred'}
									</p>
									<Button
										variant="default"
										onClick={() => window.location.reload()}
										className="mt-4"
									>
										Retry
									</Button>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const { entity: entityDetail } = entity
	const entityType = getEntityType(entityDetail.incoming)

	const nameTriple = entityDetail.triples.find(
		(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
	)
	const entityName = (nameTriple?.value.value as string | undefined) ?? undefined

	return (
		<div className="p-6 space-y-6">
			{/* Entity header */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="flex flex-col">
							<div className="flex items-center gap-3">
								{entityName ? (
									<span className="text-lg font-semibold text-gray-900">{entityName}</span>
								) : null}
								<EntityTypeBadge type={entityType} />
								<StatusBadge status={entityDetail.status} />
							</div>
							<TruncateId
								id={entityDetail.id}
								className={entityName ? 'text-gray-400 text-xs' : ''}
							/>
						</div>
					</div>
					<div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
						<div>
							<span className="font-medium text-gray-700">Created:</span>{' '}
							{formatDate(entityDetail.createdAt)}
						</div>
						<div>
							<span className="font-medium text-gray-700">Updated:</span>{' '}
							{formatDate(entityDetail.updatedAt)}
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Triples panel */}
			<TriplesPanel triples={entityDetail.triples} />

			{/* Relations panel */}
			<RelationsPanel outgoing={entityDetail.outgoing} incoming={entityDetail.incoming} />
		</div>
	)
}
