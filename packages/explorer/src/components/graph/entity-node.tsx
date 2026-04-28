import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { memo } from 'react'
import { cn } from '~/lib/utils'
import type { GraphNode } from './force-layout'

/**
 * Entity kind determines the dot color:
 * Entity = accent (blue), Property = amber, Type = purple
 */
export type EntityKind = 'Entity' | 'Property' | 'Type' | 'unknown'

const kindDotColors: Record<EntityKind, string> = {
	Entity: 'bg-accent',
	Property: 'bg-warning',
	Type: 'bg-purple',
	unknown: 'bg-muted-foreground',
}

/**
 * EntityNode data for ReactFlow
 */
export type EntityNodeData = {
	entityId: string
	label?: string
	kind?: EntityKind
	/** Whether this node is dimmed (not related to selected node) */
	dimmed?: boolean
}

export type EntityNode = Node<EntityNodeData, 'entity'>

/**
 * Custom ReactFlow node styled per Graphite design:
 * - Non-selected: small dot indicator (colored by kind), white bg, subtle border
 * - Selected: solid accent bg, white text, accent shadow, no dot, bold
 */
function EntityNodeBase({ data, selected }: NodeProps<EntityNode>) {
	const entityId = data.entityId
	const displayText = data.label ?? entityId
	const kind = data.kind ?? 'unknown'
	const dimmed = data.dimmed ?? false

	return (
		<div
			className={cn(
				'px-2.5 py-1 rounded-xl text-[11.5px] whitespace-nowrap cursor-pointer transition-all',
				selected
					? 'bg-accent text-accent-foreground border-none font-semibold shadow-[0_4px_14px_rgba(47,92,255,.35)]'
					: 'bg-card text-[#3f3f46] border border-[#e4e4e7] font-medium shadow-[0_1px_2px_rgba(0,0,0,.04)]',
				dimmed && !selected && 'opacity-35',
			)}
			tabIndex={0}
			role="button"
			aria-label={`Entity ${data.label ? `${data.label} (${entityId})` : entityId}`}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!w-1.5 !h-1.5 !bg-transparent !border-transparent"
				aria-label="Connection target"
			/>
			<div
				className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-48"
				title={entityId}
			>
				{!selected && (
					<span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', kindDotColors[kind])} />
				)}
				{displayText}
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!w-1.5 !h-1.5 !bg-transparent !border-transparent"
				aria-label="Connection source"
			/>
		</div>
	)
}

export const EntityNode = memo(EntityNodeBase)

/**
 * Converts a GraphNode (from force-layout) to ReactFlow node format.
 */
export function toReactFlowNode(node: GraphNode, _index: number): EntityNode {
	return {
		id: node.id,
		type: 'entity',
		position: { x: node.x ?? 0, y: node.y ?? 0 },
		data: { entityId: node.id, label: node.label },
		// Preserve the fixed/pinned state
		draggable: !node.fixed,
	}
}

/**
 * Converts ReactFlow node back to GraphNode format.
 */
export function fromReactFlowNode(node: EntityNode): Partial<GraphNode> {
	return {
		id: node.id,
		x: node.position.x,
		y: node.position.y,
		fixed: !node.draggable,
	}
}
