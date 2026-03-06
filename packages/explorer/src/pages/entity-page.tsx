import { useParams } from 'react-router'
import type { EntityStatus } from '~/api/types'
import { RelationsPanel } from '~/components/relations-panel'
import { TriplesPanel } from '~/components/triples-panel'
import { TruncateId } from '~/components/ui/truncate-id'
import { useEntity } from '~/hooks/use-entities'

/**
 * Status badge component for displaying entity status.
 */
function StatusBadge({ status }: { status: EntityStatus }) {
	const isAlive = status === 'alive'

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
				isAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
			}`}
		>
			{status}
		</span>
	)
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
				<div className="bg-white rounded-lg border border-gray-200 p-8">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
						<span className="ml-3 text-gray-500">Loading entity...</span>
					</div>
				</div>
			</div>
		)
	}

	// Error state (including 404 not found)
	if (isError || !entity) {
		const isNotFound = error && 'status' in error && (error as { status: number }).status === 404

		return (
			<div className="p-6">
				<div className="bg-white rounded-lg border border-gray-200 p-8">
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
								<button
									type="button"
									onClick={() => window.location.reload()}
									className="mt-4 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
								>
									Retry
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		)
	}

	const { entity: entityDetail } = entity

	return (
		<div className="p-6">
			{/* Entity header */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<TruncateId id={entityDetail.id} maxLength={16} />
						<StatusBadge status={entityDetail.status} />
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
			</div>

			{/* Triples panel */}
			<TriplesPanel triples={entityDetail.triples} className="mb-6" />

			{/* Relations panel */}
			<RelationsPanel outgoing={entityDetail.outgoing} incoming={entityDetail.incoming} />
		</div>
	)
}
