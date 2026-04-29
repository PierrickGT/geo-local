import { ChevronLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Relation, Triple, ValueType } from '~/api/types'
import { CopyIdButton } from '~/components/ui/copy-id-button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Panel } from '~/components/ui/panel'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { TabBar } from '~/components/ui/tab-bar'
import { TypePill } from '~/components/ui/type-pill'
import { useEntity, usePropertyNames } from '~/hooks/use-entities'
import { useCreateRelation, useDeleteEntity, useDeleteRelation } from '~/hooks/use-mutations'
import {
	DATA_TYPE_ENTITY_ID,
	NAME_PROPERTY_ID,
	PROPERTY_ENTITY_ID,
	RELATION_ENTITY_ID,
	RENDERABLE_TYPE_ENTITY_ID,
	SYSTEM_ENTITY_NAMES,
	TYPES_PROPERTY_ID,
	TYPE_ENTITY_ID,
	formatPropertyId,
} from '~/lib/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EntityCategory = 'Type' | 'Property' | 'Relation' | 'Entity'

function getEntityType(
	outgoing: Relation[],
	incoming: Relation[],
): { category: EntityCategory; rawCategory: string } {
	const outTypeInfo = outgoing
		.filter((r) => r.relationType === TYPES_PROPERTY_ID)
		.map((r) => r.toId)

	if (outTypeInfo.includes(DATA_TYPE_ENTITY_ID))
		return { category: 'Type', rawCategory: 'data type' }
	if (outTypeInfo.includes(RENDERABLE_TYPE_ENTITY_ID))
		return { category: 'Type', rawCategory: 'renderable type' }
	if (outTypeInfo.includes(RELATION_ENTITY_ID))
		return { category: 'Relation', rawCategory: 'relation' }
	if (outTypeInfo.includes(PROPERTY_ENTITY_ID))
		return { category: 'Property', rawCategory: 'property' }
	if (incoming.some((r) => r.relationType === TYPES_PROPERTY_ID))
		return { category: 'Type', rawCategory: 'type' }
	if (outTypeInfo.includes(TYPE_ENTITY_ID)) return { category: 'Type', rawCategory: 'type' }
	return { category: 'Entity', rawCategory: 'entity' }
}

function formatDate(isoString: string): string {
	const date = new Date(isoString)
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

function getInitials(name: string): string {
	return name
		.split(/[\s_\-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase())
		.join('')
}

function truncateEntityId(id: string, max = 16): string {
	return id.length > max ? `${id.slice(0, max)}…` : id
}

function getRawValue(triple: Triple): unknown {
	const v = triple.value
	if (typeof v === 'object' && v !== null && 'value' in v) return v.value
	return v
}

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

// ---------------------------------------------------------------------------
// Value Type Badge
// ---------------------------------------------------------------------------

const VALUE_TYPE_STYLES: Record<string, string> = {
	text: 'text-muted-foreground bg-line-soft',
	number: 'text-muted-foreground bg-line-soft',
	boolean: 'text-muted-foreground bg-line-soft',
	reference: 'text-muted-foreground bg-line-soft',
	json: 'text-muted-foreground bg-line-soft',
	date: 'text-muted-foreground bg-line-soft',
}

function ValueTypeBadge({ type }: { type: string }) {
	const cls = VALUE_TYPE_STYLES[type] ?? 'text-muted-foreground bg-line-soft'
	return (
		<span
			data-slot="value-type-badge"
			className={`inline-flex items-center text-xs font-mono tracking-wide px-[5px] py-[1px] rounded-[3px] ${cls}`}
		>
			{type}
		</span>
	)
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
			// error captured in state
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) deleteEntity.reset()
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
					<button
						type="button"
						className="border border-border bg-card text-foreground px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-hover transition-colors"
						onClick={() => handleOpenChange(false)}
						disabled={deleteEntity.isLoading}
					>
						Cancel
					</button>
					<button
						type="button"
						className="border border-red-200 bg-card text-destructive px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-red-50 transition-colors"
						onClick={handleConfirm}
						disabled={deleteEntity.isLoading}
						data-testid="confirm-delete-button"
					>
						{deleteEntity.isLoading && <Spinner className="mr-1 inline" />}
						Delete
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
			// error captured in state
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
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
						<label htmlFor="relation-type" className="text-sm font-medium text-foreground">
							Relation Type (Property ID)
						</label>
						<input
							id="relation-type"
							className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground"
							placeholder="e.g. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
							value={relationType}
							onChange={(e) => setRelationType(e.target.value)}
							disabled={createRelation.isLoading}
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="target-entity-id" className="text-sm font-medium text-foreground">
							Target Entity ID
						</label>
						<input
							id="target-entity-id"
							className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground"
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
						<button
							type="button"
							className="border border-border bg-card text-foreground px-3 py-1.5 rounded-md text-sm cursor-pointer"
							onClick={() => handleOpenChange(false)}
							disabled={createRelation.isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!canSubmit || createRelation.isLoading}
							className="bg-foreground text-background px-3 py-1.5 rounded-md text-sm cursor-pointer disabled:opacity-50"
						>
							{createRelation.isLoading && <Spinner className="mr-1 inline" />}
							Add Relation
						</button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Remove Relation Dialog
// ---------------------------------------------------------------------------

type Direction = 'outgoing' | 'incoming'

interface UnifiedRelation extends Relation {
	direction: Direction
}

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
			await deleteRelation.mutateAsync({ id: relation.id, entityId })
			deleteRelation.reset()
			onOpenChange(false)
		} catch {
			// error captured in state
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) deleteRelation.reset()
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
					<button
						type="button"
						className="border border-border bg-card text-foreground px-3 py-1.5 rounded-md text-sm cursor-pointer"
						onClick={() => handleOpenChange(false)}
						disabled={deleteRelation.isLoading}
					>
						Cancel
					</button>
					<button
						type="button"
						className="border border-red-200 bg-card text-destructive px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-red-50"
						onClick={handleConfirm}
						disabled={deleteRelation.isLoading}
					>
						{deleteRelation.isLoading && <Spinner className="mr-1 inline" />}
						Remove
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Graph Neighborhood Placeholder
// ---------------------------------------------------------------------------

function GraphNeighborhood({
	entityName,
	totalRelations,
}: { entityName: string; totalRelations: number }) {
	return (
		<Panel
			title="Graph neighborhood"
			right={
				<span className="text-xs text-muted-foreground font-mono">
					{totalRelations > 0 ? `${totalRelations + 1} nodes · ${totalRelations} edges` : '1 node'}
				</span>
			}
		>
			<div
				className="relative h-[170px]"
				style={{
					background:
						'radial-gradient(circle at center, var(--color-line-soft) 1px, transparent 1px) 0 0/14px 14px, var(--color-background)',
				}}
			>
				<div
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap bg-accent text-white z-10"
					style={{ boxShadow: '0 2px 8px rgba(47,92,255,.3)' }}
				>
					{entityName}
				</div>
			</div>
		</Panel>
	)
}

// ---------------------------------------------------------------------------
// Entity Detail Page
// ---------------------------------------------------------------------------

export function EntityPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { entity, isLoading, isError, error } = useEntity(id ?? '')
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [activeTab, setActiveTab] = useState('properties')
	const [addRelationDialogOpen, setAddRelationDialogOpen] = useState(false)
	const [removeTarget, setRemoveTarget] = useState<UnifiedRelation | null>(null)

	// Loading state
	if (isLoading) {
		return (
			<div className="p-[18px_20px_24px]">
				<div className="bg-card border border-border rounded-lg p-4 mb-3">
					<div className="flex items-start gap-3.5">
						<Skeleton className="w-10 h-10 rounded-lg" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-3.5 w-64" />
							<Skeleton className="h-3.5 w-96" />
						</div>
					</div>
				</div>
				<div className="grid grid-cols-[1fr_380px] gap-3">
					<div className="space-y-3">
						<Skeleton className="h-10 w-full rounded-lg" />
						<Skeleton className="h-64 w-full rounded-lg" />
					</div>
					<div className="space-y-3">
						<Skeleton className="h-[220px] rounded-lg" />
						<Skeleton className="h-[120px] rounded-lg" />
					</div>
				</div>
			</div>
		)
	}

	// Error state (including 404 not found)
	if (isError || !entity) {
		const isNotFound = error && 'status' in error && (error as { status: number }).status === 404

		return (
			<div className="p-[18px_20px_24px]">
				<div className="bg-card border border-border rounded-lg p-8 text-center">
					{isNotFound ? (
						<>
							<svg
								className="mx-auto h-12 w-12 text-muted-foreground"
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
							<h3 className="mt-2 text-sm font-medium text-foreground">Entity not found</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								The entity with ID &quot;{id}&quot; does not exist.
							</p>
						</>
					) : (
						<>
							<svg
								className="mx-auto h-12 w-12 text-destructive"
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
							<h3 className="mt-2 text-sm font-medium text-foreground">Failed to load entity</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{error?.message || 'An unexpected error occurred'}
							</p>
							<button
								type="button"
								className="mt-4 bg-foreground text-background px-3 py-1.5 rounded-md text-sm cursor-pointer"
								onClick={() => window.location.reload()}
							>
								Retry
							</button>
						</>
					)}
				</div>
			</div>
		)
	}

	const { entity: entityDetail } = entity
	const { category, rawCategory } = getEntityType(entityDetail.outgoing, entityDetail.incoming)

	const nameTriple = entityDetail.triples.find(
		(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
	)
	const entityName =
		(nameTriple?.value.value as string | undefined) ?? SYSTEM_ENTITY_NAMES[entityDetail.id]

	const initials = entityName ? getInitials(entityName) : entityDetail.id.slice(0, 2).toUpperCase()

	const totalRelations = entityDetail.outgoing.length + entityDetail.incoming.length

	const tabs = [
		{ id: 'properties', label: `Properties · ${entityDetail.triples.length}` },
		{ id: 'relations', label: `Relations · ${totalRelations}` },
		{ id: 'json', label: 'JSON' },
		{ id: 'history', label: 'History · 0' },
	]

	// Resolve data type for meta
	const dataTypeRelation = entityDetail.outgoing.find(
		(r) =>
			r.relationType === TYPES_PROPERTY_ID &&
			// The to entity of the TYPE relation that is a data type
			r.toId === DATA_TYPE_ENTITY_ID,
	)

	return (
		<div className="p-[18px_20px_24px] max-w-[1600px] mx-auto">
			{/* Header card */}
			<div className="bg-card border border-border rounded-lg p-4 mb-3">
				<div className="flex items-start gap-3.5">
					{/* Avatar */}
					<div className="w-10 h-10 rounded-lg bg-accent/10 text-accent grid place-items-center text-[20px] font-semibold border border-accent/[0.13] font-mono flex-shrink-0">
						{initials}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2.5 mb-0.5">
							{entityName && (
								<span className="text-[24px] font-semibold tracking-tight text-foreground">
									{entityName}
								</span>
							)}
							<TypePill kind={category} />
							<span className="text-xs text-success bg-green-50 px-[7px] py-[2px] rounded font-medium">
								published
							</span>
						</div>

						<div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
							<span>{entityDetail.id}</span>
							<CopyIdButton value={entityDetail.id} />
						</div>

						{/* Meta row */}
						<div className="flex gap-[22px] mt-3 text-xs text-muted-foreground">
							<div>
								<span className="text-[#a1a1aa]">Created</span>{' '}
								<span className="font-mono text-[#3f3f46] ml-1">
									{formatDate(entityDetail.createdAt)}
								</span>
							</div>
							<div>
								<span className="text-[#a1a1aa]">Updated</span>{' '}
								<span className="font-mono text-[#3f3f46] ml-1">
									{formatDate(entityDetail.updatedAt)}
								</span>
							</div>
							{dataTypeRelation && (
								<div>
									<span className="text-[#a1a1aa]">Data type</span>{' '}
									<span className="font-mono text-[#3f3f46] ml-1">text</span>
								</div>
							)}
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex gap-1.5 flex-shrink-0">
						<button
							type="button"
							className="flex items-center gap-1.5 border border-border bg-card text-foreground px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-hover transition-colors"
							onClick={() => navigate('/entities')}
						>
							<ChevronLeftIcon className="size-3.5" />
							Back
						</button>
						<button
							type="button"
							className="flex items-center gap-1.5 border border-border bg-card text-foreground px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-hover transition-colors"
							onClick={() => navigate(`/entities/${entityDetail.id}/edit`)}
							data-testid="edit-entity-button"
						>
							<PencilIcon className="size-3.5" />
							Edit
						</button>
						<button
							type="button"
							className="flex items-center gap-1.5 border border-red-200 bg-card text-destructive px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-red-50 transition-colors"
							onClick={() => setDeleteDialogOpen(true)}
							data-testid="delete-entity-button"
						>
							<Trash2Icon className="size-3.5" />
							Delete
						</button>
					</div>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-[1fr_380px] gap-3">
				{/* Left column */}
				<div className="flex flex-col gap-3">
					<TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

					{/* Properties tab */}
					{activeTab === 'properties' && <PropertiesPanel triples={entityDetail.triples} />}

					{/* Relations tab */}
					{activeTab === 'relations' && (
						<RelationsTab
							entityId={entityDetail.id}
							outgoing={entityDetail.outgoing}
							incoming={entityDetail.incoming}
							onAddRelation={() => setAddRelationDialogOpen(true)}
							onRemoveRelation={(rel) => setRemoveTarget(rel)}
						/>
					)}

					{/* JSON tab */}
					{activeTab === 'json' && (
						<div className="bg-card border border-border rounded-lg overflow-hidden">
							<pre className="p-3.5 font-mono text-xs text-[#3f3f46] whitespace-pre-wrap break-all leading-relaxed">
								{JSON.stringify(entityDetail, null, 2)}
							</pre>
						</div>
					)}

					{/* History tab */}
					{activeTab === 'history' && (
						<div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
							No edit history available.
						</div>
					)}
				</div>

				{/* Right rail */}
				<div className="flex flex-col gap-3">
					<GraphNeighborhood
						entityName={entityName ?? entityDetail.id}
						totalRelations={totalRelations}
					/>

					<Panel title="Activity">
						<div className="px-3.5 py-3 text-center text-xs text-muted-foreground">
							No recent activity.
						</div>
					</Panel>

					<Panel title="Raw">
						<pre className="m-0 p-[10px_14px] font-mono text-xs text-[#3f3f46] whitespace-pre-wrap break-all leading-relaxed">
							{JSON.stringify(
								{
									id: entityDetail.id,
									type: rawCategory,
									name: entityName,
									...(entityDetail.triples.length > 0 && {
										properties: Object.fromEntries(
											entityDetail.triples.map((t) => [t.propertyId, getRawValue(t)]),
										),
									}),
								},
								null,
								2,
							)}
						</pre>
					</Panel>
				</div>
			</div>

			{/* Dialogs */}
			<DeleteEntityDialog
				entityId={entityDetail.id}
				entityName={entityName}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			/>
			<AddRelationDialog
				entityId={entityDetail.id}
				open={addRelationDialogOpen}
				onOpenChange={setAddRelationDialogOpen}
			/>
			{removeTarget && (
				<RemoveRelationDialog
					relation={removeTarget}
					entityId={entityDetail.id}
					open={removeTarget !== null}
					onOpenChange={(nextOpen) => {
						if (!nextOpen) setRemoveTarget(null)
					}}
				/>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Properties Panel (with resolved names, 170px/1fr grid)
// ---------------------------------------------------------------------------

function PropertiesPanel({ triples }: { triples: Triple[] }) {
	const propertyIds = useMemo(() => [...new Set(triples.map((t) => t.propertyId))], [triples])
	const { names: propertyNames } = usePropertyNames(propertyIds)

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
			<div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
				No properties found for this entity.
			</div>
		)
	}

	return (
		<div className="bg-card border border-border rounded-lg overflow-hidden">
			{triples.map((triple, index) => {
				const rawValue = getRawValue(triple)
				const displayValue = formatValue(rawValue, triple.valueType)
				const isReference = triple.valueType === 'reference'
				const resolvedName = propertyNames.get(triple.propertyId)
				const displayName = resolvedName ?? formatPropertyId(triple.propertyId)
				const isLast = index === triples.length - 1

				return (
					<div
						key={`${triple.propertyId}-${index}`}
						className="grid grid-cols-[170px_1fr] gap-3 px-3.5 py-3 items-center"
						style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)' }}
					>
						<div className="flex items-center gap-2">
							<span className="font-mono text-xs text-foreground">{displayName}</span>
							<ValueTypeBadge type={triple.valueType} />
						</div>
						{isReference && rawValue != null ? (
							<a
								href={`/entities/${encodeURIComponent(String(rawValue))}`}
								onClick={(e) => {
									e.preventDefault()
									window.location.href = `/entities/${encodeURIComponent(String(rawValue))}`
								}}
								className="text-accent hover:underline text-sm text-[#3f3f46] leading-relaxed"
								title={String(rawValue)}
							>
								{referenceNames.get(String(rawValue)) ?? truncateEntityId(String(rawValue))}
							</a>
						) : (
							<span className="text-sm text-[#3f3f46] leading-relaxed break-all">
								{displayValue.length > 200 ? `${displayValue.slice(0, 200)}…` : displayValue}
							</span>
						)}
					</div>
				)
			})}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Relations Tab
// ---------------------------------------------------------------------------

function RelationsTab({
	outgoing,
	incoming,
	onAddRelation,
	onRemoveRelation,
}: {
	entityId: string
	outgoing: Relation[]
	incoming: Relation[]
	onAddRelation: () => void
	onRemoveRelation: (rel: UnifiedRelation) => void
}) {
	const navigate = useNavigate()

	const allRelations: UnifiedRelation[] = useMemo(
		() => [
			...outgoing.map((r) => ({ ...r, direction: 'outgoing' as const })),
			...incoming.map((r) => ({ ...r, direction: 'incoming' as const })),
		],
		[outgoing, incoming],
	)

	const relationTypeIds = useMemo(
		() => [...new Set(allRelations.map((r) => r.relationType))],
		[allRelations],
	)
	const linkedEntityIds = useMemo(
		() => [...new Set(allRelations.map((r) => (r.direction === 'outgoing' ? r.toId : r.fromId)))],
		[allRelations],
	)

	const { names: propertyNames } = usePropertyNames(relationTypeIds)
	const { names: linkedEntityNames } = usePropertyNames(linkedEntityIds)

	if (allRelations.length === 0) {
		return (
			<div className="bg-card border border-border rounded-lg overflow-hidden">
				<div className="px-3.5 py-2.5 border-b border-border flex items-center">
					<div className="text-sm font-medium text-foreground">Relations</div>
					<div className="flex-1" />
					<button
						type="button"
						className="flex items-center gap-1 border border-border bg-card text-foreground px-2 py-[3px] rounded-[5px] text-xs cursor-pointer hover:bg-hover transition-colors"
						onClick={onAddRelation}
						data-testid="add-relation-button"
					>
						<svg width="10" height="10" viewBox="0 0 10 10" role="img" aria-label="Plus">
							<path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" />
						</svg>
						Add relation
					</button>
				</div>
				<div className="px-3.5 py-8 text-center text-muted-foreground text-sm">
					No relations found for this entity.
				</div>
			</div>
		)
	}

	return (
		<div className="bg-card border border-border rounded-lg overflow-hidden">
			<div className="px-3.5 py-2.5 border-b border-border flex items-center">
				<div className="text-sm font-medium text-foreground">
					Relations{' '}
					<span className="text-muted-foreground font-normal font-mono">{allRelations.length}</span>
				</div>
				<div className="flex-1" />
				<button
					type="button"
					className="flex items-center gap-1 border border-border bg-card text-foreground px-2 py-[3px] rounded-[5px] text-xs cursor-pointer hover:bg-hover transition-colors"
					onClick={onAddRelation}
					data-testid="add-relation-button"
				>
					<svg width="10" height="10" viewBox="0 0 10 10" role="img" aria-label="Plus">
						<path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" />
					</svg>
					Add relation
				</button>
			</div>
			{allRelations.map((relation, index) => {
				const linkedEntityId = relation.direction === 'outgoing' ? relation.toId : relation.fromId
				const resolvedName = propertyNames.get(relation.relationType)
				const displayName = resolvedName ?? formatPropertyId(relation.relationType)
				const linkedEntityName = linkedEntityNames.get(linkedEntityId)
				const isLast = index === allRelations.length - 1

				return (
					<div
						key={`${relation.fromId}-${relation.toId}-${relation.relationType}-${index}`}
						className="grid grid-cols-[170px_auto_1fr_auto] gap-3 px-3.5 py-[11px] items-center"
						style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)' }}
					>
						<span className="font-mono text-xs text-[#3f3f46]">{displayName}</span>

						{/* Direction arrow */}
						<svg
							width="18"
							height="10"
							viewBox="0 0 18 10"
							className="text-[#71717a] flex-shrink-0"
							role="img"
							aria-label={relation.direction === 'outgoing' ? 'outgoing →' : '← incoming'}
							data-testid={`direction-arrow-${relation.direction}`}
						>
							<title>{relation.direction === 'outgoing' ? 'outgoing →' : '← incoming'}</title>
							{relation.direction === 'outgoing' ? (
								<>
									<path d="M1 5h14" stroke="currentColor" strokeWidth="1.2" />
									<path
										d="M13 2l3 3-3 3"
										stroke="currentColor"
										strokeWidth="1.2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</>
							) : (
								<>
									<path d="M3 5h14" stroke="currentColor" strokeWidth="1.2" />
									<path
										d="M5 2L2 5l3 3"
										stroke="currentColor"
										strokeWidth="1.2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</>
							)}
						</svg>

						{/* Linked entity */}
						<div className="flex items-center gap-2 min-w-0">
							<span className="w-[5px] h-[5px] rounded-sm bg-accent flex-shrink-0" />
							<a
								href={`/entities/${encodeURIComponent(linkedEntityId)}`}
								onClick={(e) => {
									e.preventDefault()
									navigate(`/entities/${encodeURIComponent(linkedEntityId)}`)
								}}
								className="text-accent font-medium text-sm cursor-pointer hover:underline truncate"
								title={linkedEntityId}
							>
								{linkedEntityName ?? truncateEntityId(linkedEntityId)}
							</a>
							<span className="text-xs text-muted-foreground bg-line-soft px-1.5 py-[1px] rounded-[3px] font-mono">
								Entity
							</span>
						</div>

						{/* Remove button */}
						<button
							type="button"
							className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 border-none bg-transparent"
							onClick={() => onRemoveRelation(relation)}
							data-testid={`remove-relation-button-${index}`}
							aria-label={`Remove ${displayName} relation`}
						>
							<svg width="13" height="13" viewBox="0 0 13 13" role="img" aria-label="More options">
								<circle cx="3" cy="6.5" r="1" fill="currentColor" />
								<circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
								<circle cx="10" cy="6.5" r="1" fill="currentColor" />
							</svg>
						</button>
					</div>
				)
			})}
		</div>
	)
}
