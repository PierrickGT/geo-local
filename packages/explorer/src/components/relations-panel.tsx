import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Relation } from '~/api/types'
import { formatPropertyId } from '~/lib/constants'

interface RelationsPanelProps {
	outgoing: Relation[]
	incoming: Relation[]
	className?: string
}

type TabType = 'outgoing' | 'incoming'

/**
 * Truncates an entity ID for display.
 */
function truncateEntityId(id: string, maxLength = 12): string {
	return id.length > maxLength ? `${id.slice(0, maxLength)}...` : id
}

/**
 * Relations panel with tabs for outgoing and incoming relations.
 * Each relation shows the relation type and linked entity.
 * Clicking a linked entity navigates to its detail page.
 */
export function RelationsPanel({ outgoing, incoming, className = '' }: RelationsPanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>('outgoing')
	const navigate = useNavigate()

	const relations = activeTab === 'outgoing' ? outgoing : incoming

	const handleEntityClick = (entityId: string) => {
		navigate(`/entities/${encodeURIComponent(entityId)}`)
	}

	const handleKeyDown = (entityId: string, event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			handleEntityClick(entityId)
		}
	}

	return (
		<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
			{/* Tab headers */}
			<div className="border-b border-gray-200">
				<div className="flex">
					<button
						type="button"
						onClick={() => setActiveTab('outgoing')}
						className={`px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === 'outgoing'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700'
						}`}
					>
						Outgoing ({outgoing.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('incoming')}
						className={`px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === 'incoming'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700'
						}`}
					>
						Incoming ({incoming.length})
					</button>
				</div>
			</div>

			{/* Relations list */}
			<div className="divide-y divide-gray-100">
				{relations.length === 0 ? (
					<div className="px-4 py-8 text-center text-gray-500">No {activeTab} relations found.</div>
				) : (
					relations.map((relation, index) => {
						const linkedEntityId = activeTab === 'outgoing' ? relation.toId : relation.fromId

						return (
							<div
								key={`${relation.fromId}-${relation.toId}-${relation.relationType}-${index}`}
								className="px-4 py-3 hover:bg-gray-50"
							>
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<span className="font-mono text-sm text-gray-700" title={relation.relationType}>
											{formatPropertyId(relation.relationType)}
										</span>
										<svg
											className="w-4 h-4 text-gray-400 flex-shrink-0"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/>
										</svg>
										<button
											type="button"
											onClick={() => handleEntityClick(linkedEntityId)}
											onKeyDown={(e) => handleKeyDown(linkedEntityId, e)}
											className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded font-mono text-sm"
											title={linkedEntityId}
										>
											{truncateEntityId(linkedEntityId)}
										</button>
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
