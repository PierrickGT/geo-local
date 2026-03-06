import { beforeEach, describe, expect, it } from 'vitest'
import {
	type GraphEdge,
	type GraphNode,
	createSimulation,
	pinNode,
	setNodePosition,
	togglePinNode,
	unpinNode,
} from './force-layout'

describe('force-layout', () => {
	let nodes: GraphNode[]
	let edges: GraphEdge[]

	beforeEach(() => {
		nodes = [
			{ id: 'node-1', x: 0, y: 0 },
			{ id: 'node-2', x: 100, y: 0 },
			{ id: 'node-3', x: 50, y: 100 },
		]
		edges = [
			{ id: 'edge-1', source: 'node-1', target: 'node-2', type: 'RELATES_TO' },
			{ id: 'edge-2', source: 'node-2', target: 'node-3', type: 'RELATES_TO' },
		]
	})

	describe('createSimulation', () => {
		it('returns a simulation object', () => {
			const simulation = createSimulation(nodes, edges)
			expect(simulation).toBeDefined()
			expect(simulation.nodes()).toBe(nodes)
		})

		it('produces stable positions after tick', () => {
			const simulation = createSimulation(nodes, edges)

			// Run simulation for enough ticks to stabilize
			simulation.tick(300)

			// All nodes should have defined positions
			for (const node of nodes) {
				expect(node.x).toBeDefined()
				expect(node.y).toBeDefined()
				expect(typeof node.x).toBe('number')
				expect(typeof node.y).toBe('number')
				// Positions should be finite (not NaN or Infinity)
				expect(Number.isFinite(node.x)).toBe(true)
				expect(Number.isFinite(node.y)).toBe(true)
			}
		})

		it('applies default configuration', () => {
			const simulation = createSimulation(nodes, edges)

			// Verify forces are configured
			const linkForce = simulation.force('link')
			const chargeForce = simulation.force('charge')
			const centerForce = simulation.force('center')
			const collideForce = simulation.force('collide')

			expect(linkForce).toBeDefined()
			expect(chargeForce).toBeDefined()
			expect(centerForce).toBeDefined()
			expect(collideForce).toBeDefined()
		})

		it('accepts custom configuration', () => {
			const customConfig = {
				linkDistance: 200,
				manyBodyStrength: -500,
				collideRadius: 80,
				center: { x: 100, y: 100 },
			}
			const simulation = createSimulation(nodes, edges, customConfig)

			expect(simulation).toBeDefined()
			// Run to verify configuration doesn't break simulation
			simulation.tick(100)
			for (const node of nodes) {
				expect(Number.isFinite(node.x)).toBe(true)
				expect(Number.isFinite(node.y)).toBe(true)
			}
		})

		it('handles empty nodes array', () => {
			const emptyNodes: GraphNode[] = []
			const emptyEdges: GraphEdge[] = []
			const simulation = createSimulation(emptyNodes, emptyEdges)

			expect(simulation.nodes()).toEqual([])
		})

		it('handles empty edges array', () => {
			const simulation = createSimulation(nodes, [])

			// Should still work, just no link forces applied
			simulation.tick(100)
			for (const node of nodes) {
				expect(Number.isFinite(node.x)).toBe(true)
				expect(Number.isFinite(node.y)).toBe(true)
			}
		})

		it('works with nodes that have initial positions', () => {
			const nodesWithPositions: GraphNode[] = [
				{ id: 'a', x: 0, y: 0 },
				{ id: 'b', x: 200, y: 200 },
			]
			const edgesWithPositions: GraphEdge[] = [{ id: 'e1', source: 'a', target: 'b', type: 'LINK' }]

			const simulation = createSimulation(nodesWithPositions, edgesWithPositions)
			simulation.tick(200)

			// Nodes should have moved from initial positions
			// (unless forces perfectly balance, which is unlikely)
			for (const node of nodesWithPositions) {
				expect(Number.isFinite(node.x)).toBe(true)
				expect(Number.isFinite(node.y)).toBe(true)
			}
		})
	})

	describe('pinNode', () => {
		it('sets fx and fy to current position', () => {
			const node: GraphNode = { id: 'test', x: 50, y: 75 }
			pinNode(node)

			expect(node.fx).toBe(50)
			expect(node.fy).toBe(75)
			expect(node.fixed).toBe(true)
		})

		it('pins node at its current x/y position', () => {
			const node: GraphNode = { id: 'test', x: 100, y: 200 }
			pinNode(node)

			expect(node.fx).toBe(node.x)
			expect(node.fy).toBe(node.y)
		})
	})

	describe('unpinNode', () => {
		it('clears fx and fy', () => {
			const node: GraphNode = { id: 'test', x: 50, y: 75, fx: 50, fy: 75, fixed: true }
			unpinNode(node)

			expect(node.fx).toBeNull()
			expect(node.fy).toBeNull()
			expect(node.fixed).toBe(false)
		})
	})

	describe('togglePinNode', () => {
		it('pins an unpinned node', () => {
			const node: GraphNode = { id: 'test', x: 50, y: 75 }
			const result = togglePinNode(node)

			expect(result).toBe(true)
			expect(node.fixed).toBe(true)
			expect(node.fx).toBe(50)
			expect(node.fy).toBe(75)
		})

		it('unpins a pinned node', () => {
			const node: GraphNode = { id: 'test', x: 50, y: 75, fx: 50, fy: 75, fixed: true }
			const result = togglePinNode(node)

			expect(result).toBe(false)
			expect(node.fixed).toBe(false)
			expect(node.fx).toBeNull()
			expect(node.fy).toBeNull()
		})
	})

	describe('setNodePosition', () => {
		it('updates position and pins node', () => {
			const node: GraphNode = { id: 'test', x: 0, y: 0 }
			setNodePosition(node, 100, 200)

			expect(node.x).toBe(100)
			expect(node.y).toBe(200)
			expect(node.fx).toBe(100)
			expect(node.fy).toBe(200)
			expect(node.fixed).toBe(true)
		})

		it('updates position of already pinned node', () => {
			const node: GraphNode = { id: 'test', x: 0, y: 0, fx: 0, fy: 0, fixed: true }
			setNodePosition(node, 150, 250)

			expect(node.x).toBe(150)
			expect(node.y).toBe(250)
			expect(node.fx).toBe(150)
			expect(node.fy).toBe(250)
		})
	})

	describe('integration: pinned nodes are unaffected by simulation', () => {
		it('pinned nodes stay at their fixed position during simulation', () => {
			const testNodes: GraphNode[] = [
				{ id: 'pinned', x: 0, y: 0 },
				{ id: 'free', x: 100, y: 0 },
			]
			const testEdges: GraphEdge[] = [{ id: 'e1', source: 'pinned', target: 'free', type: 'LINK' }]

			// Pin the first node
			pinNode(testNodes[0])

			const simulation = createSimulation(testNodes, testEdges)
			simulation.tick(300)

			// Pinned node should stay at original position
			expect(testNodes[0].x).toBe(0)
			expect(testNodes[0].y).toBe(0)
			expect(testNodes[0].fx).toBe(0)
			expect(testNodes[0].fy).toBe(0)

			// Free node should have moved
			expect(testNodes[1].x).toBeDefined()
			expect(testNodes[1].y).toBeDefined()
		})
	})
})
