import { fireEvent, render, screen } from '@testing-library/react'
import { ReactFlow } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'
import { EntityNode, type EntityNodeData } from './entity-node'

// Default props that satisfy NodeProps
const defaultProps = {
	id: 'test-node',
	data: {} as EntityNodeData,
	selected: false,
	type: 'entity' as const,
	dragging: false,
	isConnectable: true,
	position: { x: 0, y: 0 },
	positionAbsoluteX: 0,
	positionAbsoluteY: 0,
	zIndex: 0,
	draggable: true,
	selectable: true,
	deletable: true,
	parentId: undefined,
	sourcePosition: Position.Bottom,
	targetPosition: Position.Top,
	ariaLabel: undefined,
	width: undefined,
	height: undefined,
}

// Wrapper component that provides ReactFlow context
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ReactFlow
			nodes={[]}
			edges={[]}
			nodeTypes={{
				entity: (props) => (
					<EntityNode {...props} {...defaultProps} data={props.data as EntityNodeData} />
				),
			}}
		>
			{children}
		</ReactFlow>
	)
}

describe('EntityNode', () => {
	it('displays truncated entity ID', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'abc123def456ghi789' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('abc123de...')).toBeInTheDocument()
	})

	it('displays full ID in title attribute', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'abc123def456ghi789' }} />
			</TestWrapper>,
		)

		expect(screen.getByTitle('abc123def456ghi789')).toBeInTheDocument()
	})

	it('displays short IDs without truncation', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'short' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('short')).toBeInTheDocument()
	})

	it('calls onClick when clicked', () => {
		const onClick = vi.fn()
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'entity-123' }} onClick={onClick} />
			</TestWrapper>,
		)

		fireEvent.click(screen.getByText('entity-12...'))

		expect(onClick).toHaveBeenCalledWith('entity-123')
	})

	it('calls onDoubleClick when double-clicked', () => {
		const onDoubleClick = vi.fn()
		render(
			<TestWrapper>
				<EntityNode
					{...defaultProps}
					data={{ entityId: 'entity-456' }}
					onDoubleClick={onDoubleClick}
				/>
			</TestWrapper>,
		)

		fireEvent.doubleClick(screen.getByText('entity-45...'))

		expect(onDoubleClick).toHaveBeenCalledWith('entity-456')
	})

	it('stops event propagation on click', () => {
		const parentClick = vi.fn()
		const onClick = vi.fn()

		render(
			<TestWrapper>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: test wrapper, not interactive element */}
				<div onClick={parentClick}>
					<EntityNode {...defaultProps} data={{ entityId: 'entity-789' }} onClick={onClick} />
				</div>
			</TestWrapper>,
		)

		fireEvent.click(screen.getByText('entity-78...'))

		expect(onClick).toHaveBeenCalled()
		expect(parentClick).not.toHaveBeenCalled()
	})
})
