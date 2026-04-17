import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Relation } from '~/api/types'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { usePropertyNames } from '~/hooks/use-entities'
import { useCreateRelation, useDeleteRelation } from '~/hooks/use-mutations'
import { formatPropertyId } from '~/lib/constants'

interface RelationsPanelProps {
	entityId: string
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

// ---------------------------------------------------------------------------
// Add Relation Dialog
// ---------------------------------------------------------------------------

function AddRelationDialog({
	entityId,
	open,
	onOpenChange,
}: {
	entityId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [relationType, setRelationType] = useState('')
	const [targetEntityId, setTargetEntityId] = useState('')
	const createRelation = useCreateRelation()

	const canSubmit = relationType.trim() !== '' && targetEntityId.trim() !== ''

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit || createRelation.isLoading) return

		try {
			await createRelation.mutateAsync({
				fromEntity: entityId,
				toEntity: targetEntityId.trim(),
				type: relationType.trim(),
			})
			setRelationType('')
			setTargetEntityId('')
			createRelation.reset()
			onOpenChange(false)
		} catch {
			// Error is captured in createRelation.error, dialog stays open
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			// Reset form on close
			setRelationType('')
			setTargetEntityId('')
			createRelation.reset()
		}
		onOpenChange(nextOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Relation</DialogTitle>
					<DialogDescription>
						Create a new outgoing relation from this entity to a target entity.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="relation-type">Relation Type (Property ID)</Label>
						<Input
							id="relation-type"
							placeholder="e.g. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
							value={relationType}
							onChange={(e) => setRelationType(e.target.value)}
							disabled={createRelation.isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="target-entity-id">Target Entity ID</Label>
						<Input
							id="target-entity-id"
							placeholder="32-character hex entity ID"
							value={targetEntityId}
							onChange={(e) => setTargetEntityId(e.target.value)}
							disabled={createRelation.isLoading}
						/>
					</div>
					{createRelation.error && (
						<div className="text-sm text-destructive" data-testid="add-relation-error">
							{createRelation.error.message}
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={createRelation.isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit || createRelation.isLoading}>
							{createRelation.isLoading && <Spinner className="mr-1" />}
							Add Relation
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Remove Relation Dialog
// ---------------------------------------------------------------------------

function RemoveRelationDialog({
	relation,
	entityId,
	open,
	onOpenChange,
}: {
	relation: UnifiedRelation
	entityId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const deleteRelation = useDeleteRelation()

	async function handleConfirm() {
		if (deleteRelation.isLoading) return

		try {
			await deleteRelation.mutateAsync({
				id: relation.id,
				entityId,
			})
			deleteRelation.reset()
			onOpenChange(false)
		} catch {
			// Error is captured in deleteRelation.error, dialog stays open
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			deleteRelation.reset()
		}
		onOpenChange(nextOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Remove Relation</DialogTitle>
					<DialogDescription>
						Are you sure you want to remove the{' '}
						<span className="font-medium">{formatPropertyId(relation.relationType)}</span> relation
						{relation.direction === 'outgoing'
							? ` to ${truncateEntityId(relation.toId, 16)}`
							: ` from ${truncateEntityId(relation.fromId, 16)}`}
						?
					</DialogDescription>
				</DialogHeader>
				{deleteRelation.error && (
					<div className="text-sm text-destructive" data-testid="remove-relation-error">
						{deleteRelation.error.message}
					</div>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={deleteRelation.isLoading}
					>
						Cancel
					</Button>
					<Button variant="destructive" onClick={handleConfirm} disabled={deleteRelation.isLoading}>
						{deleteRelation.isLoading && <Spinner className="mr-1" />}
						Remove
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// RelationsPanel
// ---------------------------------------------------------------------------

/**
 * Relations panel showing all relations in a unified list.
 * Each relation shows the relation type, direction indicator, and linked entity.
 * Clicking a linked entity navigates to its detail page.
 * Supports adding and removing relations via dialogs.
 */
export function RelationsPanel({
	entityId,
	outgoing,
	incoming,
	className = '',
}: RelationsPanelProps) {
	const navigate = useNavigate()
	const [addDialogOpen, setAddDialogOpen] = useState(false)
	const [removeTarget, setRemoveTarget] = useState<UnifiedRelation | null>(null)

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
			<div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
				<h2 className="text-lg font-medium text-gray-900">Relations ({totalCount})</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setAddDialogOpen(true)}
					data-testid="add-relation-button"
				>
					<PlusIcon className="size-4" />
					Add Relation
				</Button>
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
									<div className="flex items-center gap-3 min-w-0">
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
											className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm truncate"
											title={linkedEntityId}
										>
											{linkedEntityName ?? truncateEntityId(linkedEntityId)}
										</a>
									</div>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => setRemoveTarget(relation)}
										data-testid={`remove-relation-button-${index}`}
										aria-label={`Remove ${displayName} relation`}
									>
										<Trash2Icon className="size-3.5 text-gray-400 hover:text-destructive" />
									</Button>
								</div>
							</div>
						)
					})
				)}
			</div>

			{/* Add Relation Dialog */}
			<AddRelationDialog entityId={entityId} open={addDialogOpen} onOpenChange={setAddDialogOpen} />

			{/* Remove Relation Dialog */}
			{removeTarget && (
				<RemoveRelationDialog
					relation={removeTarget}
					entityId={entityId}
					open={removeTarget !== null}
					onOpenChange={(nextOpen) => {
						if (!nextOpen) setRemoveTarget(null)
					}}
				/>
			)}
		</div>
	)
}
