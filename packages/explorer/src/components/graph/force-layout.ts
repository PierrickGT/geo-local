import {
	type Simulation,
	type SimulationLinkDatum,
	type SimulationNodeDatum,
	forceCenter,
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
} from 'd3-force'

/**
 * Node data for the force simulation.
 * Extends d3's SimulationNodeDatum with application-specific properties.
 */
export interface GraphNode extends SimulationNodeDatum {
	id: string
	label?: string
	/** If true, the node will not be affected by the force simulation */
	fixed?: boolean
}

/**
 * Edge data for the force simulation.
 * Uses d3's SimulationLinkDatum with source/target as node IDs.
 */
export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
	id: string
	source: string
	target: string
	type: string
}

/**
 * Configuration options for the force simulation.
 */
export interface ForceLayoutConfig {
	/** Distance between connected nodes (default: 150) */
	linkDistance?: number
	/** Strength of the many-body force, negative = repulsion (default: -300) */
	manyBodyStrength?: number
	/** Collision radius around each node (default: 60) */
	collideRadius?: number
	/** Center of the simulation (default: 0, 0) */
	center?: { x: number; y: number }
}

const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
	linkDistance: 150,
	manyBodyStrength: -300,
	collideRadius: 60,
	center: { x: 0, y: 0 },
}

/**
 * Creates a d3-force simulation for graph visualization.
 *
 * The simulation applies the following forces:
 * - Link force: keeps connected nodes at a specified distance
 * - Many-body force: repels all nodes from each other
 * - Center force: pulls nodes toward the center
 * - Collide force: prevents nodes from overlapping
 *
 * Nodes with `fixed: true` will not be affected by forces (they stay pinned).
 *
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges (relations)
 * @param config - Optional configuration for force parameters
 * @returns The configured simulation
 *
 * @example
 * ```ts
 * const nodes: GraphNode[] = [
 *   { id: 'entity-1', x: 0, y: 0 },
 *   { id: 'entity-2', x: 100, y: 0 },
 * ]
 * const edges: GraphEdge[] = [
 *   { id: 'rel-1', source: 'entity-1', target: 'entity-2', type: 'RELATES_TO' },
 * ]
 * const simulation = createSimulation(nodes, edges)
 *
 * // Run simulation to stability
 * simulation.tick(300)
 *
 * // Access positions
 * nodes.forEach(n => console.log(n.id, n.x, n.y))
 * ```
 */
export function createSimulation(
	nodes: GraphNode[],
	edges: GraphEdge[],
	config?: ForceLayoutConfig,
): Simulation<GraphNode, GraphEdge> {
	const cfg = { ...DEFAULT_CONFIG, ...config }

	// Create a map for quick node lookup by ID
	const nodeMap = new Map(nodes.map((n) => [n.id, n]))

	// Convert edge source/target from string IDs to node references
	// d3-force requires actual node references, not IDs
	const links: SimulationLinkDatum<GraphNode>[] = edges.map((edge) => ({
		...edge,
		source: nodeMap.get(edge.source) ?? edge.source,
		target: nodeMap.get(edge.target) ?? edge.target,
	}))

	const simulation = forceSimulation<GraphNode>(nodes)
		// Link force: keep connected nodes at specified distance
		.force(
			'link',
			forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(links)
				.distance(cfg.linkDistance)
				.id((d) => d.id),
		)
		// Many-body force: repel all nodes from each other
		.force('charge', forceManyBody().strength(cfg.manyBodyStrength))
		// Center force: pull nodes toward center
		.force('center', forceCenter(cfg.center.x, cfg.center.y))
		// Collide force: prevent node overlap
		.force('collide', forceCollide(cfg.collideRadius))

	return simulation
}

/**
 * Pins a node at its current position by setting fx and fy.
 * After pinning, the node will not be affected by force simulation.
 *
 * @param node - The node to pin
 */
export function pinNode(node: GraphNode): void {
	node.fx = node.x
	node.fy = node.y
	node.fixed = true
}

/**
 * Unpins a node, allowing it to be affected by force simulation again.
 *
 * @param node - The node to unpin
 */
export function unpinNode(node: GraphNode): void {
	node.fx = null
	node.fy = null
	node.fixed = false
}

/**
 * Toggles the pinned state of a node.
 *
 * @param node - The node to toggle
 * @returns The new pinned state (true = pinned)
 */
export function togglePinNode(node: GraphNode): boolean {
	if (node.fixed) {
		unpinNode(node)
		return false
	}
	pinNode(node)
	return true
}

/**
 * Updates a node's pinned position after a drag operation.
 * If the node is already pinned, updates fx/fy to the new position.
 * If not pinned, pins it at the new position.
 *
 * @param node - The node that was dragged
 * @param x - New x coordinate
 * @param y - New y coordinate
 */
export function setNodePosition(node: GraphNode, x: number, y: number): void {
	node.x = x
	node.y = y
	node.fx = x
	node.fy = y
	node.fixed = true
}
