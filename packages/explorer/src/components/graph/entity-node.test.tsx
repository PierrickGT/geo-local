import { render, screen } from '@testing-library/react'
import { ReactFlow } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
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
	it('displays entity ID when no label is provided', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'abc123def456ghi789' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('abc123def456ghi789')).toBeInTheDocument()
	})

	it('displays label when provided', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'abc123', label: 'My Entity' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('My Entity')).toBeInTheDocument()
	})

	it('displays full ID in title attribute', () => {
		render(
			<TestWrapper>
				<EntityNode
					{...defaultProps}
					data={{ entityId: 'abc123def456ghi789', label: 'My Entity' }}
				/>
			</TestWrapper>,
		)

		expect(screen.getByTitle('abc123def456ghi789')).toBeInTheDocument()
	})

	it('shows selected state styling via data.isSelected', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'entity-123', isSelected: true }} />
			</TestWrapper>,
		)

		const node = screen.getByRole('button', { name: /Entity entity-123/ })
		expect(node).toHaveClass('bg-accent')
		expect(node).toHaveClass('text-accent-foreground')
	})

	it('does not show accent styling when not selected', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'entity-123', isSelected: false }} />
			</TestWrapper>,
		)

		const node = screen.getByRole('button', { name: /Entity entity-123/ })
		expect(node).not.toHaveClass('bg-accent')
		expect(node).toHaveClass('bg-card')
	})

	it('shows kind dot when not selected', () => {
		render(
			<TestWrapper>
				<EntityNode
					{...defaultProps}
					data={{ entityId: 'test-id', kind: 'Property', isSelected: false }}
				/>
			</TestWrapper>,
		)

		const node = screen.getByRole('button', { name: /Entity test-id/ })
		const dot = node.querySelector('.rounded-full')
		expect(dot).toBeInTheDocument()
		expect(dot).toHaveClass('bg-warning')
	})

	it('hides kind dot when selected', () => {
		render(
			<TestWrapper>
				<EntityNode
					{...defaultProps}
					data={{ entityId: 'test-id', kind: 'Property', isSelected: true }}
				/>
			</TestWrapper>,
		)

		const node = screen.getByRole('button', { name: /Entity test-id/ })
		// The dot should not be present when selected
		const innerDiv = node.querySelector('.flex.items-center.gap-1\\.5')
		const dot = innerDiv?.querySelector('.rounded-full')
		expect(dot).toBeNull()
	})

	it('has correct aria-label with label', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'test-id', label: 'Test Entity' }} />
			</TestWrapper>,
		)

		expect(screen.getByRole('button', { name: 'Entity Test Entity (test-id)' })).toBeInTheDocument()
	})

	it('has correct aria-label without label', () => {
		render(
			<TestWrapper>
				<EntityNode {...defaultProps} data={{ entityId: 'test-id' }} />
			</TestWrapper>,
		)

		expect(screen.getByRole('button', { name: 'Entity test-id' })).toBeInTheDocument()
	})
})
