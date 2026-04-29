import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { EntityFormData } from '~/components/entity-form'
import { EntityForm } from '~/components/entity-form'
import { useCreateEntity } from '~/hooks/use-mutations'

/**
 * Create entity page at /entities/new.
 *
 * Graphite-styled form with:
 * - Breadcrumb (Entities › New) provided by shell layout
 * - H1 "Create entity" + hint text
 * - FormSection layout (220px/1fr grid)
 * - Sticky footer with staging indicator + Cancel + Create entity
 *
 * On submit:
 * 1. Calls useCreateEntity which POSTs to ingest and polls until applied
 * 2. Navigates to /entities/:newId
 * 3. On error: displays error banner, preserves form data
 */
export function CreateEntityPage() {
	const navigate = useNavigate()
	const { mutateAsync, isLoading, error, reset } = useCreateEntity()

	const handleSubmit = useCallback(
		async (data: EntityFormData) => {
			reset()

			// Build values array from dynamic properties (filter empty rows)
			const values = data.properties
				.filter((p) => p.propertyId.trim())
				.map((p) => ({
					property: p.propertyId.trim(),
					type: p.valueType,
					value: p.value,
				}))

			// Parse types from comma/newline-separated string
			const types = data.types
				? data.types
						.split(/[,\n]/)
						.map((t) => t.trim())
						.filter(Boolean)
				: undefined

			try {
				const result = await mutateAsync({
					name: data.name,
					description: data.description || undefined,
					values: values.length > 0 ? values : undefined,
					types: types && types.length > 0 ? types : undefined,
				})

				// Navigate to the created entity's detail page
				const entityId = result.entityIds?.[0]
				if (entityId) {
					navigate(`/entities/${entityId}`, { replace: true })
				} else {
					navigate('/entities', { replace: true })
				}
			} catch {
				// Error is handled by the hook's error state, displayed below
			}
		},
		[mutateAsync, navigate, reset],
	)

	return (
		<div className="p-[18px_20px_24px] max-w-[900px] mx-auto">
			{/* H1 + hint */}
			<div className="mb-[18px]">
				<h1 className="text-[24px] font-semibold tracking-[-0.5px] text-foreground">
					Create entity
				</h1>
				<p className="text-xs text-muted-foreground mt-1" data-testid="create-hint">
					New entity will be staged as a pending edit
				</p>
			</div>

			{error && (
				<div
					className="mb-4 rounded-lg bg-red-50 p-4 ring-1 ring-red-200"
					data-testid="create-error"
				>
					<p className="text-sm font-medium text-red-800">Failed to create entity</p>
					<p className="text-xs text-red-600 mt-1">{error.message}</p>
				</div>
			)}

			<EntityForm mode="create" onSubmit={handleSubmit} isSubmitting={isLoading} />
		</div>
	)
}
