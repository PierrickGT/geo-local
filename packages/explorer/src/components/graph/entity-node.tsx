import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { memo } from 'react'
import type { GraphNode } from './force-layout'

/**
 * EntityNode data for ReactFlow
 */
export type EntityNodeData = {
	entityId: string
}

export type EntityNode = Node<EntityNodeData, 'entity'>

/**
 * Custom ReactFlow node that displays a truncated entity ID.
 *
 * IMPORTANT: This component does NOT handle click/double-click events internally.
 * All interaction handling is done at the ReactFlow level via:
 * - onNodeClick: Navigate to entity detail
 * - onNodeDoubleClick: Expand neighbors
 * - onNodeDragStop: Pin node position
 *
 * This allows ReactFlow's event system to work correctly.
 */
function EntityNodeBase({ data, selected }: NodeProps<EntityNode>) {
	const entityId = data.entityId
	const truncated = entityId.length > 8 ? `${entityId.slice(0, 8)}...` : entityId

	return (
		<div
			className={`px-3 py-2 bg-white border-2 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all ${
				selected ? 'border-blue-600 shadow-lg' : 'border-blue-400 hover:border-blue-600'
			}`}
			tabIndex={0}
			role="button"
			aria-label={`Entity ${entityId}`}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!w-2 !h-2 !bg-blue-400"
				aria-label="Connection target"
			/>
			<div className="font-mono text-sm text-gray-700" title={entityId}>
				{truncated}
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!w-2 !h-2 !bg-blue-400"
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
		data: { entityId: node.id },
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
