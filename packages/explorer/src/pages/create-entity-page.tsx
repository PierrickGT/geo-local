import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { EntityFormData } from '~/components/entity-form'
import { EntityForm } from '~/components/entity-form'
import { useCreateEntity } from '~/hooks/use-mutations'

/**
 * Create entity page at /entities/new.
 *
 * Uses EntityForm in create mode. On submit:
 * 1. Calls useCreateEntity which POSTs to ingest and polls until applied
 * 2. Navigates to /entities/:newId
 * 3. On error: displays error message, preserves form data
 */
export function CreateEntityPage() {
	const navigate = useNavigate()
	const { mutateAsync, isLoading, error, reset } = useCreateEntity()

	const handleSubmit = useCallback(
		async (data: EntityFormData) => {
			reset()

			// Build values array from dynamic properties
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
				// The entity ID is available from the edit result's entityIds
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
		<div className="p-6 max-w-2xl">
			<h1 className="text-2xl font-semibold text-gray-900 mb-6">Create Entity</h1>

			{error && (
				<div className="mb-4 rounded-md bg-red-50 p-4 ring-1 ring-red-200" data-testid="create-error">
					<p className="text-sm font-medium text-red-800">Failed to create entity</p>
					<p className="text-sm text-red-600 mt-1">{error.message}</p>
				</div>
			)}

			<EntityForm
				mode="create"
				onSubmit={handleSubmit}
				isSubmitting={isLoading}
			/>
		</div>
	)
}
