import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Relation } from '~/api/types'
import { RelationsPanel } from '~/components/relations-panel'
import { TriplesPanel } from '~/components/triples-panel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { TruncateId } from '~/components/ui/truncate-id'
import { useEntity } from '~/hooks/use-entities'
import { useDeleteEntity } from '~/hooks/use-mutations'
import {
	DATA_TYPE_ENTITY_ID,
	NAME_PROPERTY_ID,
	PROPERTY_ENTITY_ID,
	RELATION_ENTITY_ID,
	RENDERABLE_TYPE_ENTITY_ID,
	SYSTEM_ENTITY_NAMES,
	TYPES_PROPERTY_ID,
	TYPE_ENTITY_ID,
} from '~/lib/constants'

type EntityCategory = 'type' | 'property' | 'relation' | 'renderable type' | 'data type' | 'entity'

type BadgeVariant =
	| 'default'
	| 'secondary'
	| 'destructive'
	| 'outline'
	| 'ghost'
	| 'link'
	| 'warning'
	| 'info'
	| 'success'

const ENTITY_TYPE_VARIANT: Record<EntityCategory, BadgeVariant> = {
	type: 'info',
	property: 'outline',
	relation: 'warning',
	'renderable type': 'success',
	'data type': 'secondary',
	entity: 'outline',
}

/**
 * Entity type badge for displaying the entity's category.
 */
function EntityTypeBadge({ type }: { type: EntityCategory }) {
	return (
		<Badge variant={ENTITY_TYPE_VARIANT[type]}>
			{type.charAt(0).toUpperCase() + type.slice(1)}
		</Badge>
	)
}

/**
 * Determines the entity type based on relations.
 * - "Type": if there are incoming TYPE relations (other entities use this as their type),
 *           OR if the entity has an outgoing TYPE relation to the "Type" entity (e.g. data types like Text, Boolean)
 * - "Relation": if the entity has an outgoing TYPE relation to the "Relation" entity
 * - "Renderable type": if the entity has an outgoing TYPE relation to the "Renderable type" entity
 * - "Property": if the entity has an outgoing TYPE relation to the "Property" entity
 * - "Entity": default for regular entities
 */
function getEntityType(outgoing: Relation[], incoming: Relation[]): EntityCategory {
	const outTypeInfo = outgoing
		.filter((relation) => relation.relationType === TYPES_PROPERTY_ID)
		.map((relation) => relation.toId)

	if (outTypeInfo.includes(DATA_TYPE_ENTITY_ID)) {
		return 'data type'
	}
	if (outTypeInfo.includes(RENDERABLE_TYPE_ENTITY_ID)) {
		return 'renderable type'
	}
	if (outTypeInfo.includes(RELATION_ENTITY_ID)) {
		return 'relation'
	}
	if (outTypeInfo.includes(PROPERTY_ENTITY_ID)) {
		return 'property'
	}
	const hasIncomingTypeRelations = incoming.some(
		(relation) => relation.relationType === TYPES_PROPERTY_ID,
	)
	if (hasIncomingTypeRelations) {
		return 'type'
	}
	if (outTypeInfo.includes(TYPE_ENTITY_ID)) {
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

// ---------------------------------------------------------------------------
// Delete Entity Dialog
// ---------------------------------------------------------------------------

function DeleteEntityDialog({
	entityId,
	entityName,
	open,
	onOpenChange,
}: {
	entityId: string
	entityName?: string
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const navigate = useNavigate()
	const deleteEntity = useDeleteEntity()

	async function handleConfirm() {
		if (deleteEntity.isLoading) return

		try {
			await deleteEntity.mutateAsync({ id: entityId })
			deleteEntity.reset()
			navigate('/entities')
		} catch {
			// Error is captured in deleteEntity.error, dialog stays open
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			deleteEntity.reset()
		}
		onOpenChange(nextOpen)
	}

	const displayName = entityName ?? entityId

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Entity</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete <span className="font-medium">{displayName}</span>? This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				{deleteEntity.error && (
					<div className="text-sm text-destructive" data-testid="delete-entity-error">
						{deleteEntity.error.message}
					</div>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={deleteEntity.isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={deleteEntity.isLoading}
						data-testid="confirm-delete-button"
					>
						{deleteEntity.isLoading && <Spinner className="mr-1" />}
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/**
 * Entity detail page showing entity header, triples panel, and relations panel.
 * Handles loading, not found, and error states.
 */
export function EntityPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { entity, isLoading, isError, error } = useEntity(id ?? '')
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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
	const entityType = getEntityType(entityDetail.outgoing, entityDetail.incoming)

	const nameTriple = entityDetail.triples.find(
		(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
	)
	const entityName =
		(nameTriple?.value.value as string | undefined) ?? SYSTEM_ENTITY_NAMES[entityDetail.id]

	return (
		<div className="p-6 space-y-6">
			{/* Entity header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex flex-col">
								<div className="flex items-center gap-3">
									{entityName ? (
										<span className="text-lg font-semibold text-gray-900">{entityName}</span>
									) : null}
									<EntityTypeBadge type={entityType} />
								</div>
								<TruncateId
									id={entityDetail.id}
									className={entityName ? 'text-gray-400 text-xs' : ''}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigate(`/entities/${entityDetail.id}/edit`)}
								data-testid="edit-entity-button"
							>
								<PencilIcon className="size-4" />
								Edit
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setDeleteDialogOpen(true)}
								data-testid="delete-entity-button"
							>
								<Trash2Icon className="size-4" />
								Delete
							</Button>
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
			<RelationsPanel
				entityId={entityDetail.id}
				outgoing={entityDetail.outgoing}
				incoming={entityDetail.incoming}
			/>

			{/* Delete Entity Dialog */}
			<DeleteEntityDialog
				entityId={entityDetail.id}
				entityName={entityName}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			/>
		</div>
	)
}
