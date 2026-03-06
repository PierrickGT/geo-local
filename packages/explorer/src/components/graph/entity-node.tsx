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

interface EntityNodeProps extends NodeProps<EntityNode> {
	/** Called when node is clicked (single click) */
	onClick?: (entityId: string) => void
	/** Called when node is double-clicked */
	onDoubleClick?: (entityId: string) => void
}

/**
 * Props for testing EntityNode without the full NodeProps requirements.
 */
export interface EntityNodeTestProps {
	id: string
	data: EntityNodeData
	selected?: boolean
	onClick?: (entityId: string) => void
	onDoubleClick?: (entityId: string) => void
}

/**
 * Custom ReactFlow node that displays a truncated entity ID.
 * Supports click (navigate to entity) and double-click (expand neighbors).
 */
function EntityNodeBase({ data, onClick, onDoubleClick }: EntityNodeProps) {
	const entityId = data.entityId
	const truncated = entityId.length > 8 ? `${entityId.slice(0, 8)}...` : entityId

	const handleClick = (event: React.MouseEvent) => {
		event.stopPropagation()
		onClick?.(entityId)
	}

	const handleDoubleClick = (event: React.MouseEvent) => {
		event.stopPropagation()
		onDoubleClick?.(entityId)
	}

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.stopPropagation()
			onClick?.(entityId)
		}
	}

	return (
		<div
			className="px-3 py-2 bg-white border-2 border-blue-400 rounded-lg shadow-md cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all"
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
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
