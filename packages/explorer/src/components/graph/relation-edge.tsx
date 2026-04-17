import {
	BaseEdge,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from '@xyflow/react'
import { memo } from 'react'
import { formatPropertyId } from '~/lib/constants'
import type { GraphEdge } from './force-layout'

/**
 * RelationEdge data for ReactFlow
 */
export type RelationEdgeData = {
	relationType: string
	/** Resolved property name (from usePropertyNames), used as display label */
	propertyDisplayName?: string
}

export type RelationEdge = Edge<RelationEdgeData>

interface RelationEdgeProps extends EdgeProps<RelationEdge> {
	/** Called when edge is clicked */
	onClick?: (edgeId: string, relationType: string) => void
}

/**
 * Custom ReactFlow edge that displays the relation type as a label.
 */
function RelationEdgeBase({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
	data,
	onClick,
}: RelationEdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	})

	const relationType = data?.relationType ?? ''
	const displayName = data?.propertyDisplayName ?? formatPropertyId(relationType)

	const handleClick = (event: React.MouseEvent) => {
		event.stopPropagation()
		onClick?.(id, relationType)
	}

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.stopPropagation()
			onClick?.(id, relationType)
		}
	}

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				style={{ ...style, stroke: '#94a3b8', strokeWidth: 2 }}
			/>
			<EdgeLabelRenderer>
				<div
					className="absolute bg-slate-100 px-1.5 py-0.5 rounded text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: 'all',
					}}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					role="button"
					aria-label={`Relation ${relationType}`}
					title={relationType}
				>
					{displayName}
				</div>
			</EdgeLabelRenderer>
		</>
	)
}

export const RelationEdge = memo(RelationEdgeBase)

/**
 * Converts a GraphEdge (from force-layout) to ReactFlow edge format.
 */
export function toReactFlowEdge(
	edge: GraphEdge,
	displayNames?: Map<string, string | undefined>,
): RelationEdge {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: 'relation',
		data: { relationType: edge.type, propertyDisplayName: displayNames?.get(edge.type) },
	}
}

/**
 * Converts ReactFlow edge back to GraphEdge format.
 */
export function fromReactFlowEdge(edge: RelationEdge): Partial<GraphEdge> {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: edge.data?.relationType ?? '',
	}
}
