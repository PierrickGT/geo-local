import {
	BaseEdge,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from '@xyflow/react'
import { memo } from 'react'
import { TYPES_PROPERTY_ID, formatPropertyId } from '~/lib/constants'
import { cn } from '~/lib/utils'
import type { GraphEdge } from './force-layout'

/**
 * RelationEdge data for ReactFlow
 */
export type RelationEdgeData = {
	relationType: string
	/** Resolved property name (from usePropertyNames), used as display label */
	propertyDisplayName?: string
	/** Whether this edge is incident to the selected node (accent highlight) */
	incident?: boolean
	/** Whether this edge is dimmed (unrelated to selected) */
	dimmed?: boolean
}

export type RelationEdge = Edge<RelationEdgeData>

interface RelationEdgeProps extends EdgeProps<RelationEdge> {
	/** Called when edge is clicked */
	onClick?: (edgeId: string, relationType: string) => void
}

/**
 * Custom ReactFlow edge that displays the relation type as a label.
 * Styled per Graphite design:
 * - Default: subtle gray (#e4e4e7), stroke-width 1
 * - Incident to selected: accent (#2f5cff), stroke-width 1.6
 * - Dimmed (unrelated to selected): very light (#f1f1ef), stroke-width 1
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
	const isTypeRelation = relationType === TYPES_PROPERTY_ID
	const displayName = data?.propertyDisplayName ?? formatPropertyId(relationType)
	const incident = data?.incident ?? false
	const dimmed = data?.dimmed ?? false

	const strokeColor = incident ? 'var(--accent)' : dimmed ? 'var(--line-soft)' : 'var(--border)'
	const strokeWidth = incident ? 1.6 : 1

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
				style={{ ...style, stroke: strokeColor, strokeWidth }}
			/>
			{!isTypeRelation && (
				<EdgeLabelRenderer>
					<div
						className={cn(
							'absolute px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors',
							incident
								? 'bg-accent/10 text-accent'
								: 'bg-muted text-muted-foreground hover:bg-border',
						)}
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
			)}
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
	options?: { incident?: boolean; dimmed?: boolean },
): RelationEdge {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: 'relation',
		data: {
			relationType: edge.type,
			propertyDisplayName: displayNames?.get(edge.type),
			incident: options?.incident,
			dimmed: options?.dimmed,
		},
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
