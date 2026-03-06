/**
 * Graph Page - Force-directed graph visualization using ReactFlow
 *
 * Features:
 * - Seed: first 50 entities + relations, or focused entity from ?focus=:id
 * - Click node: navigate to /entities/:id
 * - Double-click: fetch neighbors and add to graph
 * - Drag: pins node position
 * - Pan/zoom: native ReactFlow support
 */

import {
	Background,
	type Connection,
	Controls,
	type EdgeChange,
	MarkerType,
	type NodeChange,
	Panel,
	ReactFlow,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	useEdgesState,
	useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
	EntityNode,
	type EntityNode as EntityNodeType,
	toReactFlowNode,
} from '~/components/graph/entity-node'
import {
	type GraphEdge,
	type GraphNode,
	createSimulation,
	setNodePosition,
} from '~/components/graph/force-layout'
import {
	RelationEdge,
	type RelationEdge as RelationEdgeType,
	toReactFlowEdge,
} from '~/components/graph/relation-edge'
import { useEntities, useEntity, useEntityRelations } from '~/hooks/use-entities'

// Custom node and edge types
const nodeTypes = { entity: EntityNode }
const edgeTypes = { relation: RelationEdge }

// Seed configuration
const SEED_LIMIT = 50
const SIMULATION_TICKS = 300

/**
 * Graph Page component with ReactFlow canvas
 */
export function GraphPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const focusId = searchParams.get('focus')

	// Track if we're in an error state for focus mode
	const [focusError, setFocusError] = useState<string | null>(null)

	// Track expanded node IDs to prevent re-expanding
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

	// ReactFlow state
	const [nodes, setNodes] = useNodesState<EntityNodeType>([])
	const [edges, setEdges] = useEdgesState<RelationEdgeType>([])

	// Internal graph state for tracking positions and data
	const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
	const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])

	// Seed data queries
	const seedQuery = useEntities({ limit: SEED_LIMIT })
	const focusQuery = useEntity(focusId ?? '')
	const focusRelationsQuery = useEntityRelations(focusId ?? '', {})

	// Determine which data to use
	const isLoading = focusId
		? focusQuery.isLoading || focusRelationsQuery.isLoading
		: seedQuery.isLoading

	const isError = focusId ? focusQuery.isError || focusRelationsQuery.isError : seedQuery.isError

	// Convert seed data to graph format
	const seedGraphData = useMemo(() => {
		if (focusId) {
			// Focus mode: single entity with neighbors
			if (!focusQuery.entity?.entity) return null

			const entity = focusQuery.entity.entity
			const relations = focusRelationsQuery.relations?.relations ?? []

			const nodes: GraphNode[] = [{ id: entity.id, x: 0, y: 0, fixed: false }]

			// Add connected entities
			const seenIds = new Set([entity.id])
			const edges: GraphEdge[] = []

			for (const rel of relations) {
				const otherId = rel.fromId === entity.id ? rel.toId : rel.fromId
				if (!seenIds.has(otherId)) {
					seenIds.add(otherId)
					nodes.push({ id: otherId, x: 0, y: 0, fixed: false })
				}

				edges.push({
					id: `${rel.fromId}-${rel.toId}`,
					source: rel.fromId,
					target: rel.toId,
					type: rel.relationType,
				})
			}

			return { nodes, edges }
		}

		// Default mode: first N entities
		if (!seedQuery.entities?.entities) return null

		const entities = seedQuery.entities.entities
		const nodes: GraphNode[] = entities.map((e) => ({
			id: e.id,
			x: 0,
			y: 0,
			fixed: false,
		}))

		// We need to fetch relations for seed entities - but for initial render,
		// we don't have the relations yet. We'll just show nodes initially.
		// Relations will be added when user double-clicks to expand.
		return { nodes, edges: [] }
	}, [focusId, focusQuery.entity, focusRelationsQuery.relations, seedQuery.entities])

	// Initialize graph with seed data
	useEffect(() => {
		if (!seedGraphData) return

		const { nodes: seedNodes, edges: seedEdges } = seedGraphData

		// Skip if we already have data loaded (prevent re-initialization)
		if (graphNodes.length > 0) return

		// Run force simulation to get initial positions
		const simNodes = seedNodes.map((n) => ({ ...n }))
		const simEdges = seedEdges.map((e) => ({ ...e }))

		if (simNodes.length > 0) {
			const simulation = createSimulation(simNodes, simEdges)
			simulation.tick(SIMULATION_TICKS)
			simulation.stop()

			// Convert to ReactFlow format
			const rfNodes = simNodes.map((n, i) => toReactFlowNode(n, i))
			const rfEdges = simEdges.map((e) => ({
				...toReactFlowEdge(e),
				markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
			}))

			setGraphNodes(simNodes)
			setGraphEdges(simEdges)
			setNodes(rfNodes)
			setEdges(rfEdges)
		}
	}, [seedGraphData, graphNodes.length, setNodes, setEdges])

	// Handle focus error (invalid entity ID)
	useEffect(() => {
		if (focusId && focusQuery.isError) {
			setFocusError(`Entity "${focusId}" not found`)
		} else {
			setFocusError(null)
		}
	}, [focusId, focusQuery.isError])

	// Click handler: navigate to entity detail
	const handleNodeClick = useCallback(
		(_event: React.MouseEvent, node: EntityNodeType) => {
			navigate(`/entities/${node.data.entityId}`)
		},
		[navigate],
	)

	// Double-click handler: expand neighbors
	const handleNodeDoubleClick = useCallback(
		async (_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId

			// Skip if already expanded
			if (expandedNodes.has(entityId)) return

			// Fetch relations for this entity
			try {
				const response = await fetch(`/api/entities/${encodeURIComponent(entityId)}/relations`)
				if (!response.ok) {
					console.error('Failed to fetch relations')
					return
				}
				const data = await response.json()
				const relations = data.relations ?? []

				if (relations.length === 0) return

				// Find new nodes to add
				const existingIds = new Set(graphNodes.map((n) => n.id))
				const newNodes: GraphNode[] = []
				const newEdges: GraphEdge[] = []

				for (const rel of relations) {
					const otherId = rel.fromId === entityId ? rel.toId : rel.fromId

					// Add edge
					newEdges.push({
						id: `${rel.fromId}-${rel.toId}`,
						source: rel.fromId,
						target: rel.toId,
						type: rel.relationType,
					})

					// Add node if not exists
					if (!existingIds.has(otherId)) {
						existingIds.add(otherId)
						// Position near the clicked node
						const sourceNode = graphNodes.find((n) => n.id === entityId)
						newNodes.push({
							id: otherId,
							x: (sourceNode?.x ?? 0) + (Math.random() - 0.5) * 100,
							y: (sourceNode?.y ?? 0) + (Math.random() - 0.5) * 100,
							fixed: false,
						})
					}
				}

				if (newNodes.length === 0 && newEdges.length > 0) {
					// Only new edges, just add them
					const allGraphEdges = [...graphEdges, ...newEdges]
					setGraphEdges(allGraphEdges)

					const rfEdges = allGraphEdges.map((e) => ({
						...toReactFlowEdge(e),
						markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
					}))
					setEdges(rfEdges)
				} else if (newNodes.length > 0) {
					// Run simulation with all nodes
					const allNodes = [...graphNodes, ...newNodes]
					const allEdges = [...graphEdges, ...newEdges]

					const simulation = createSimulation(allNodes, allEdges)
					simulation.tick(SIMULATION_TICKS)
					simulation.stop()

					// Update state
					setGraphNodes(allNodes)
					setGraphEdges(allEdges)

					const rfNodes = allNodes.map((n, i) => toReactFlowNode(n, i))
					const rfEdges = allEdges.map((e) => ({
						...toReactFlowEdge(e),
						markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
					}))

					setNodes(rfNodes)
					setEdges(rfEdges)
				}

				// Mark as expanded
				setExpandedNodes((prev) => new Set(prev).add(entityId))
			} catch (err) {
				console.error('Error expanding node:', err)
			}
		},
		[graphNodes, graphEdges, setNodes, setEdges, expandedNodes],
	)

	// Drag handler: pin node position
	const handleNodeDragStop = useCallback(
		(_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId
			const graphNode = graphNodes.find((n) => n.id === entityId)

			if (graphNode) {
				// Update position and pin
				setNodePosition(graphNode, node.position.x, node.position.y)

				// Update graph state
				setGraphNodes((prev) => prev.map((n) => (n.id === entityId ? graphNode : n)))
			}
		},
		[graphNodes],
	)

	// Handle node changes (for dragging)
	const onNodesChange = useCallback(
		(changes: NodeChange<EntityNodeType>[]) => {
			setNodes((nds) => applyNodeChanges(changes, nds))
		},
		[setNodes],
	)

	// Handle edge changes
	const onEdgesChange = useCallback(
		(changes: EdgeChange<RelationEdgeType>[]) => {
			setEdges((eds) => applyEdgeChanges(changes, eds))
		},
		[setEdges],
	)

	// Handle new connections (not used but required by types)
	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((eds) => addEdge(connection, eds))
		},
		[setEdges],
	)

	// Retry handler
	const handleRetry = useCallback(() => {
		if (focusId) {
			focusQuery.refetch()
			focusRelationsQuery.refetch()
		} else {
			seedQuery.refetch()
		}
	}, [focusId, focusQuery, focusRelationsQuery, seedQuery])

	// Loading state
	if (isLoading) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="text-gray-500">
					<div className="animate-pulse">Loading graph data...</div>
				</div>
			</div>
		)
	}

	// Error state
	if (isError || focusError) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-600 mb-4">{focusError ?? 'Failed to load graph data'}</div>
					<button
						type="button"
						onClick={handleRetry}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		)
	}

	// Empty state
	if (graphNodes.length === 0) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="text-gray-500">
					No entities to display. Add some entities to see the graph.
				</div>
			</div>
		)
	}

	return (
		<div className="h-full w-full">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={handleNodeClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onNodeDragStop={handleNodeDragStop}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				minZoom={0.1}
				maxZoom={4}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
			>
				<Background />
				<Controls />
				<Panel position="top-left" className="bg-white/80 p-2 rounded shadow-sm">
					<div className="text-sm text-gray-600">
						<div className="font-medium mb-1">Graph ({graphNodes.length} nodes)</div>
						<div className="text-xs text-gray-400">
							Click: view entity | Double-click: expand | Drag: pin
						</div>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	)
}
