import { fireEvent, render, screen } from '@testing-library/react'
import { Position, ReactFlow } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'
import { RelationEdge, type RelationEdgeData } from './relation-edge'

// Default props that satisfy EdgeProps
const defaultProps = {
	id: 'edge-1',
	source: 'node-1',
	target: 'node-2',
	sourceX: 0,
	sourceY: 0,
	targetX: 100,
	targetY: 100,
	sourcePosition: Position.Bottom,
	targetPosition: Position.Top,
	data: {} as RelationEdgeData,
	selected: false,
	animated: false,
	type: 'relation' as const,
	style: {},
	zIndex: 0,
	updatable: false,
	deletable: false,
	markerEnd: undefined,
	markerStart: undefined,
	interactionWidth: undefined,
}

// Wrapper component that provides ReactFlow context
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ReactFlow
			nodes={[]}
			edges={[]}
			edgeTypes={{
				relation: (props) => (
					<RelationEdge {...props} {...defaultProps} data={props.data as RelationEdgeData} />
				),
			}}
		>
			{children}
		</ReactFlow>
	)
}

describe('RelationEdge', () => {
	it('displays full relation type without truncation', () => {
		render(
			<TestWrapper>
				<RelationEdge {...defaultProps} data={{ relationType: 'VERY_LONG_RELATION_TYPE' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('VERY_LONG_RELATION_TYPE')).toBeInTheDocument()
	})

	it('displays full relation type in title', () => {
		render(
			<TestWrapper>
				<RelationEdge {...defaultProps} data={{ relationType: 'RELATES_TO' }} />
			</TestWrapper>,
		)

		expect(screen.getByTitle('RELATES_TO')).toBeInTheDocument()
	})

	it('displays short relation types without truncation', () => {
		render(
			<TestWrapper>
				<RelationEdge {...defaultProps} data={{ relationType: 'TYPE' }} />
			</TestWrapper>,
		)

		expect(screen.getByText('TYPE')).toBeInTheDocument()
	})

	it('calls onClick when label is clicked', () => {
		const onClick = vi.fn()
		render(
			<TestWrapper>
				<RelationEdge {...defaultProps} data={{ relationType: 'RELATES_TO' }} onClick={onClick} />
			</TestWrapper>,
		)

		fireEvent.click(screen.getByText('RELATES_TO'))

		expect(onClick).toHaveBeenCalledWith('edge-1', 'RELATES_TO')
	})

	it('stops event propagation on label click', () => {
		const parentClick = vi.fn()
		const onClick = vi.fn()

		render(
			<TestWrapper>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: test wrapper, not interactive element */}
				<div onClick={parentClick}>
					<RelationEdge {...defaultProps} data={{ relationType: 'RELATES_TO' }} onClick={onClick} />
				</div>
			</TestWrapper>,
		)

		fireEvent.click(screen.getByText('RELATES_TO'))

		expect(onClick).toHaveBeenCalled()
		expect(parentClick).not.toHaveBeenCalled()
	})

	it('handles missing data gracefully', () => {
		render(
			<TestWrapper>
				<RelationEdge {...defaultProps} data={undefined} />
			</TestWrapper>,
		)

		// Should render empty label when no data
		expect(screen.getByTitle('')).toBeInTheDocument()
	})
})
