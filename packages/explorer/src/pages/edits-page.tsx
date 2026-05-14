import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import type { DecodedOp, Edit } from '~/api/types'
import { Button } from '~/components/ui/button'
import { DiffPane } from '~/components/ui/diff-pane'
import { Panel } from '~/components/ui/panel'
import { Skeleton } from '~/components/ui/skeleton'
import { TabBar } from '~/components/ui/tab-bar'
import { formatPropertyId } from '~/lib/constants'
import { useEdits } from '~/hooks/use-edits'
import { usePropertyNames } from '~/hooks/use-entities'

// ---------------------------------------------------------------------------
// Tab IDs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Badge config per decoded op kind
// ---------------------------------------------------------------------------

type BadgeKind = 'create' | 'update' | 'relation' | 'unknown'

function getBadgeKind(op: DecodedOp | null): BadgeKind {
	if (!op) return 'unknown'
	if (op.kind === 'createEntity') return 'create'
	if (op.kind === 'updateEntity') return 'update'
	if (op.kind === 'createRelation' || op.kind === 'deleteRelation') return 'relation'
	return 'unknown'
}

const BADGE_STYLES: Record<BadgeKind, { label: string; className: string }> = {
	create: {
		label: 'CREATE',
		className: 'text-[#0ea34a] bg-[#ecfdf5]',
	},
	update: {
		label: 'UPDATE',
		className: 'text-accent bg-accent/5',
	},
	relation: {
		label: 'RELATION',
		className: 'text-[#7c3aed] bg-[#f3e8ff]',
	},
	unknown: {
		label: 'EDIT',
		className: 'text-muted-foreground bg-muted',
	},
}

// ---------------------------------------------------------------------------
// Status → Tab mapping
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Extract displayable text from decoded op values
// ---------------------------------------------------------------------------

function extractTextValue(val: unknown): string {
	if (val === null || val === undefined) return ''
	if (typeof val === 'string') return val
	if (typeof val === 'number' || typeof val === 'boolean') return String(val)
	if (typeof val === 'object') {
		const obj = val as Record<string, unknown>
		// {value: "text", language: "..."} — simple triple value
		if (typeof obj.value === 'string') return obj.value
		// {value: {type: "text", payload: {value: "..."}}, propertyId: "..."} — nested payload
		if (typeof obj.value === 'object' && obj.value !== null) {
			const inner = obj.value as Record<string, unknown>
			if (typeof inner.payload === 'object' && inner.payload !== null) {
				const payload = inner.payload as Record<string, unknown>
				if (typeof payload.value === 'string') return payload.value
			}
			if (typeof inner.value === 'string') return inner.value
		}
		// Fallback: JSON stringify
		return JSON.stringify(val)
	}
	return String(val)
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
	const now = Date.now()
	const then = new Date(dateStr).getTime()
	const diff = Math.max(0, now - then)
	const seconds = Math.floor(diff / 1000)
	if (seconds < 60) return `${seconds}s ago`
	const minutes = Math.floor(seconds / 60)
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function EditsPage() {
	// Fetch edits
	const { edits: editsData, isLoading, isError, error, refetch } = useEdits()

	const allEdits = editsData?.edits ?? []

	// Compute stats
	const publishedCount = useMemo(
		() => allEdits.filter((e) => e.status === 'applied' || e.status === 'failed').length,
		[allEdits],
	)

	// Show all applied/failed edits
	const filteredEdits = useMemo(
		() => allEdits.filter((e) => e.status === 'applied' || e.status === 'failed'),
		[allEdits],
	)

	return (
		<div className="p-5 max-w-[1400px] mx-auto space-y-0">
			{/* Header: H1 + Stats */}
			<div className="mb-4">
				<h1 className="text-[24px] font-semibold tracking-[-0.5px]">Edits</h1>
				<div className="text-xs text-muted-foreground mt-1">
					{publishedCount} published
				</div>
			</div>

			{/* Tabs */}
			<TabBar tabs={[{ id: 'history', label: `History · ${publishedCount}` }]} activeTab="history" onTabChange={() => {}} />

			{/* Error state */}
			{isError && (
				<Panel title="Error" className="mt-3">
					<div className="flex items-center justify-between p-4">
						<div>
							<h3 className="text-sm font-medium text-destructive">Failed to load edits</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{error?.message || 'An unexpected error occurred'}
							</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				</Panel>
			)}

			{/* Loading skeletons */}
			{isLoading && !isError && (
				<div className="mt-3 space-y-2.5">
					<Skeleton className="h-[72px] w-full rounded-lg" />
					<Skeleton className="h-[72px] w-full rounded-lg" />
					<Skeleton className="h-[72px] w-full rounded-lg" />
				</div>
			)}

			{/* Empty state */}
			{!isLoading && !isError && filteredEdits.length === 0 && (
				<Panel title="No edits" className="mt-3">
					<div className="py-6 px-4 text-center text-muted-foreground text-sm">
						No edits found.
					</div>
				</Panel>
			)}

			{/* Edit cards */}
			{!isLoading && !isError && filteredEdits.length > 0 && (
				<div className="mt-3 flex flex-col gap-2.5">
					{filteredEdits.map((edit) => (
						<EditCard key={edit.id} edit={edit} />
					))}
				</div>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// EditCard Component
// ---------------------------------------------------------------------------

function EditCard({ edit }: { edit: Edit }) {
	const firstOp = edit.decodedOps?.[0] ?? null
	const badgeKind = getBadgeKind(firstOp)
	const badgeConfig = BADGE_STYLES[badgeKind]

	// Collect IDs to resolve
	const idsToResolve = useMemo(() => {
		const ids: string[] = []
		if (firstOp?.propertyId) ids.push(firstOp.propertyId)
		if (firstOp?.toId) ids.push(firstOp.toId)
		if (firstOp?.fromId) ids.push(firstOp.fromId)
		if (firstOp?.relationType) ids.push(firstOp.relationType)
		return ids
	}, [firstOp])
	const { names } = usePropertyNames(idsToResolve)

	// Determine target entity name
	const targetName = edit.name || edit.id

	// Determine field descriptor
	const fieldDescriptor = useMemo(() => {
		if (!firstOp) return null
		if (firstOp.kind === 'updateEntity' && firstOp.propertyId) {
			return names.get(firstOp.propertyId) ?? formatPropertyId(firstOp.propertyId)
		}
		if (firstOp.kind === 'createRelation' && firstOp.relationType) {
			const toName = firstOp.toId ? (names.get(firstOp.toId) ?? firstOp.toId) : ''
			return `→ ${toName}`
		}
		if (firstOp.kind === 'deleteRelation' && firstOp.relationType) {
			const toName = firstOp.toId ? (names.get(firstOp.toId) ?? firstOp.toId) : ''
			return `→ ${toName}`
		}
		return null
	}, [firstOp, names])

	// Determine diff values
	const diffValues = useMemo(() => {
		if (!firstOp || firstOp.kind !== 'updateEntity') return null
		return {
			before: extractTextValue(firstOp.before),
			after: extractTextValue(firstOp.after),
		}
	}, [firstOp])

	const isPending = edit.status === 'pending' || edit.status === 'processing'
	const isFailed = edit.status === 'failed'

	return (
		<div
			data-testid="edit-card"
			className="bg-card border border-border rounded-lg overflow-hidden"
		>
			{/* Header row */}
			<div className="px-3.5 py-2.5 border-b border-[#e4e4e7] flex items-center gap-2.5">
				{/* Color-coded badge */}
				<span
					data-badge-kind={badgeKind}
					className={`font-mono text-xs px-[7px] py-[2px] rounded-[3px] font-semibold tracking-[0.5px] ${badgeConfig.className}`}
				>
					{badgeConfig.label}
				</span>

				{/* Target entity name */}
				<span className="font-medium text-sm">{targetName}</span>

				{/* Field descriptor */}
				{fieldDescriptor && (
					<span className="font-mono text-xs text-muted-foreground">· {fieldDescriptor}</span>
				)}

				<div className="flex-1" />

				{/* Author + relative time */}
				<span className="text-xs text-muted-foreground">
					<span className="font-mono text-[#3f3f46]">{edit.author}</span> ·{' '}
					{relativeTime(edit.createdAt)}
				</span>
			</div>

			{/* Diff columns - only for applied edits with update ops */}
			{!isPending && diffValues && (
				<div className="p-2.5">
					<DiffPane before={diffValues.before} after={diffValues.after} />
				</div>
			)}

			{/* Create entity body - minimal */}
			{!isPending && firstOp?.kind === 'createEntity' && (
				<div className="px-3.5 py-3 text-xs text-muted-foreground bg-[#fafafa]">
					{isFailed ? 'Failed to create entity' : 'Entity created'}
				</div>
			)}

			{/* Relation body */}
			{!isPending &&
				firstOp &&
				(firstOp.kind === 'createRelation' || firstOp.kind === 'deleteRelation') && (
					<div className="px-3.5 py-3 text-xs text-[#3f3f46] bg-[#fafafa] font-mono">
						{firstOp.kind === 'createRelation' ? '+ Add' : '- Remove'}{' '}
						<span className="text-accent">
							{firstOp.fromId
								? (names.get(firstOp.fromId) ?? firstOp.fromId)
								: firstOp.entityId}
						</span>
						{firstOp.relationType && (
							<>
								{' '}
								—[{names.get(firstOp.relationType) ?? firstOp.relationType}]→{' '}
								<span className="text-accent">
									{firstOp.toId ? (names.get(firstOp.toId) ?? firstOp.toId) : ''}
								</span>
							</>
						)}
					</div>
				)}

			{/* Failed edit error */}
			{isFailed && edit.errorMsg && (
				<div className="px-3.5 py-3 text-xs text-destructive bg-destructive/5">{edit.errorMsg}</div>
			)}

			{/* Pending minimal view - no diff, just subtle status */}
			{isPending && (
				<div className="px-3.5 py-3 text-xs text-muted-foreground bg-[#fafafa]">
					{edit.status === 'processing' ? 'Processing...' : 'Waiting to be processed'}
				</div>
			)}
		</div>
	)
}
