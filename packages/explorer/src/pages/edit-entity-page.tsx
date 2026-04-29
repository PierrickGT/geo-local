import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { PropertyValueParam, UnsetPropertyParam } from '~/api/mutations'
import { useSetBreadcrumb } from '~/app/breadcrumb-context'
import type { EntityFormData, PropertyRow } from '~/components/entity-form'
import { EntityForm, triplesToFormData } from '~/components/entity-form'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { useEntity } from '~/hooks/use-entities'
import { useUpdateEntity } from '~/hooks/use-mutations'
import { DESCRIPTION_PROPERTY_ID, NAME_PROPERTY_ID, TYPES_PROPERTY_ID } from '~/lib/constants'

// ---------------------------------------------------------------------------
// Diff computation
// ---------------------------------------------------------------------------

interface DiffResult {
	values: PropertyValueParam[]
	unset: UnsetPropertyParam[]
}

/**
 * Compute the diff between the initial form data (from entity triples)
 * and the current form state. Produces `values` for changed/added triples
 * and `unset` for removed custom properties.
 *
 * System triples (name, description, types) are mapped to their corresponding
 * mutation fields; custom properties go into the values/unset arrays.
 */
function computeDiff(initial: EntityFormData, current: EntityFormData): DiffResult {
	const values: PropertyValueParam[] = []
	const unset: UnsetPropertyParam[] = []

	// --- System fields ---
	if (current.name !== initial.name) {
		values.push({ property: NAME_PROPERTY_ID, type: 'text', value: current.name })
	}

	if (current.description !== initial.description) {
		values.push({
			property: DESCRIPTION_PROPERTY_ID,
			type: 'text',
			value: current.description,
		})
	}

	if (current.types !== initial.types) {
		values.push({
			property: TYPES_PROPERTY_ID,
			type: 'reference',
			value: current.types,
		})
	}

	// --- Custom properties: build a map by propertyId for the initial state ---
	const initialPropertyMap = new Map<string, PropertyRow>()
	for (const row of initial.properties) {
		if (row.propertyId.trim()) {
			initialPropertyMap.set(row.propertyId.trim(), row)
		}
	}

	const currentPropertyIds = new Set<string>()

	for (const row of current.properties) {
		const pid = row.propertyId.trim()
		if (!pid) continue

		currentPropertyIds.add(pid)
		const orig = initialPropertyMap.get(pid)

		if (!orig) {
			// New property — add to values
			values.push({
				property: pid,
				type: row.valueType,
				value: row.value,
			})
		} else if (orig.valueType !== row.valueType || orig.value !== row.value) {
			// Changed property — add to values
			values.push({
				property: pid,
				type: row.valueType,
				value: row.value,
			})
		}
		// else: unchanged — skip
	}

	// Properties that existed initially but are gone from current → unset
	for (const pid of initialPropertyMap.keys()) {
		if (!currentPropertyIds.has(pid)) {
			unset.push({ property: pid })
		}
	}

	return { values, unset }
}

/**
 * Extract the entity name from triples.
 */
function getEntityName(triples: { propertyId: string; value: { value: unknown } }[]): string {
	const nameTriple = triples.find((t) => t.propertyId === NAME_PROPERTY_ID)
	return nameTriple ? String(nameTriple.value.value ?? '') : ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Edit entity page at /entities/:id/edit.
 *
 * Graphite-styled form with:
 * - Breadcrumb (Entities › {Name} › Edit) set via breadcrumb context
 * - H1 "Edit entity" + hint
 * - EntityForm in edit mode with pre-populated data
 * - Disabled ID field with "generated · immutable" hint
 * - Dirty tracking (submit disabled when pristine)
 * - Minimal diff computation (only changed fields sent)
 * - Cancel navigates to /entities/:id
 *
 * Hooks are safe across loading/error/loaded transitions — all hook calls
 * are unconditional (before any early returns).
 */
export function EditEntityPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { entity, isLoading, isError, error } = useEntity(id ?? '')
	const { mutateAsync, isLoading: isSubmitting, error: mutationError, reset } = useUpdateEntity()
	const setBreadcrumb = useSetBreadcrumb()

	// All hook calls must come before conditional returns (React rules of hooks)
	const initialData = useMemo(() => {
		if (!entity?.entity) return undefined
		return triplesToFormData(entity.entity.triples)
	}, [entity])

	const entityName = useMemo(() => {
		if (!entity?.entity) return ''
		return getEntityName(entity.entity.triples)
	}, [entity])

	// Update breadcrumb with entity name
	useEffect(() => {
		if (entityName) {
			setBreadcrumb(['Entities', entityName, 'Edit'])
		} else {
			setBreadcrumb(null)
		}
		return () => setBreadcrumb(null)
	}, [entityName, setBreadcrumb])

	const handleCancel = useCallback(() => {
		navigate(`/entities/${id}`)
	}, [id, navigate])

	const handleSubmit = useCallback(
		async (data: EntityFormData) => {
			if (!initialData) return

			reset()

			const { values, unset } = computeDiff(initialData, data)

			// Filter out empty values arrays
			const hasValues = values.length > 0
			const hasUnset = unset.length > 0

			if (!hasValues && !hasUnset) return

			try {
				await mutateAsync({
					id: id ?? '',
					name: data.name !== initialData.name ? data.name : undefined,
					description: data.description !== initialData.description ? data.description : undefined,
					values: hasValues ? values : undefined,
					unset: hasUnset ? unset : undefined,
				})

				navigate(`/entities/${id}`, { replace: true })
			} catch {
				// Error handled by hook state, displayed below
			}
		},
		[id, initialData, mutateAsync, navigate, reset],
	)

	// Error state (check before loading to avoid showing skeleton on error)
	if (isError) {
		const isNotFound = error && 'status' in error && (error as { status: number }).status === 404

		return (
			<div className="p-[28px_20px_24px] max-w-[1600px] mx-auto">
				<Card>
					<CardContent className="py-8">
						<div className="text-center">
							{isNotFound ? (
								<>
									<h3 className="text-sm font-medium text-foreground">Entity not found</h3>
									<p className="mt-1 text-xs text-muted-foreground">
										The entity with ID &quot;{id}&quot; does not exist.
									</p>
									<Button variant="default" onClick={() => navigate('/entities')} className="mt-4">
										Go to Entities
									</Button>
								</>
							) : (
								<>
									<h3 className="text-sm font-medium text-foreground">Failed to load entity</h3>
									<p className="mt-1 text-xs text-muted-foreground">
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

	// Loading state
	if (isLoading || !initialData) {
		return (
			<div className="p-[28px_20px_24px] max-w-[1600px] mx-auto">
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		)
	}

	return (
		<div className="p-[28px_20px_24px] max-w-[1600px] mx-auto">
			{/* H1 + hint */}
			<div className="mb-[18px]">
				<h1 className="text-[24px] font-semibold tracking-[-0.5px] text-foreground">Edit entity</h1>
				<p className="text-xs text-muted-foreground mt-1" data-testid="edit-hint">
					Changes will be staged as edits until published
				</p>
			</div>

			{mutationError && (
				<div className="mb-4 rounded-lg bg-red-50 p-4 ring-1 ring-red-200" data-testid="edit-error">
					<p className="text-sm font-medium text-red-800">Failed to update entity</p>
					<p className="text-xs text-red-600 mt-1">{mutationError.message}</p>
				</div>
			)}

			<EntityForm
				mode="edit"
				initialData={initialData}
				entityId={id}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				isSubmitting={isSubmitting}
			/>
		</div>
	)
}
