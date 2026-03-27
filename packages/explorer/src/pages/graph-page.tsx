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
import { getEntity, getEntityRelations } from '~/api/entities'
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
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { useEntities, useEntity, useEntityRelations } from '~/hooks/use-entities'
import { NAME_PROPERTY_ID } from '~/lib/constants'

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

	// Click delay state for distinguishing click vs double-click
	const [pendingClick, setPendingClick] = useState<{
		nodeId: string
		timer: ReturnType<typeof setTimeout>
	} | null>(null)

	// ReactFlow state
	const [nodes, setNodes] = useNodesState<EntityNodeType>([])
	const [edges, setEdges] = useEdgesState<RelationEdgeType>([])

	// Internal graph state for tracking positions and data
	const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
	const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])

	// Track TYPE relations fetched for seed entities
	const [seedTypeRelations, setSeedTypeRelations] = useState<{
		nodes: GraphNode[]
		edges: GraphEdge[]
	} | null>(null)

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

			// Focus entity at center
			const nodes: GraphNode[] = [{ id: entity.id, x: 0, y: 0, fixed: false }]

			// Add connected entities in a circular layout around the focus
			const seenIds = new Set([entity.id])
			const edges: GraphEdge[] = []
			const neighbors: string[] = []

			for (const rel of relations) {
				const otherId = rel.fromId === entity.id ? rel.toId : rel.fromId
				if (!seenIds.has(otherId)) {
					seenIds.add(otherId)
					neighbors.push(otherId)
				}

				edges.push({
					id: `${rel.fromId}-${rel.toId}`,
					source: rel.fromId,
					target: rel.toId,
					type: rel.relationType,
				})
			}

			// Place neighbors in a circle around the focus entity
			const radius = 200
			neighbors.forEach((id, i) => {
				const angle = (2 * Math.PI * i) / neighbors.length
				nodes.push({
					id,
					x: radius * Math.cos(angle),
					y: radius * Math.sin(angle),
					fixed: false,
				})
			})

			return { nodes, edges }
		}

		// Default mode: first N entities with TYPE relations
		if (!seedQuery.entities?.entities) return null

		const entities = seedQuery.entities.entities
		const count = entities.length
		const radius = 200 // Circular layout radius

		// Initialize nodes in a circular layout to prevent force simulation
		// from pushing them to extreme positions (±20,000 pixels)
		const nodes: GraphNode[] = entities.map((e, i) => {
			const angle = (2 * Math.PI * i) / count
			return {
				id: e.id,
				x: radius * Math.cos(angle),
				y: radius * Math.sin(angle),
				fixed: false,
			}
		})

		// Add TYPE entity nodes (positioned later by force simulation)
		if (seedTypeRelations) {
			nodes.push(...seedTypeRelations.nodes)
		}

		// Use TYPE relations edges if available
		const edges = seedTypeRelations?.edges ?? []

		return { nodes, edges }
	}, [
		focusId,
		focusQuery.entity,
		focusRelationsQuery.relations,
		seedQuery.entities,
		seedTypeRelations,
	])

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

	// Fetch entity names once and inject labels into ReactFlow nodes
	useEffect(() => {
		if (graphNodes.length === 0) return

		const ids = graphNodes.map((n) => n.id)
		let cancelled = false

		Promise.all(
			ids.map((id) =>
				getEntity(id)
					.then((res) => {
						const entity = res.entity
						const nameTriple = entity?.triples.find(
							(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
						)
						return { id, label: (nameTriple?.value.value as string | undefined) ?? undefined }
					})
					.catch(() => ({ id, label: undefined })),
			),
		).then((results) => {
			if (cancelled) return
			const labelMap = new Map(results.map((r) => [r.id, r.label]))
			setNodes((prev) =>
				prev.map((node) => {
					const label = labelMap.get(node.data.entityId)
					if (label === undefined || node.data.label === label) return node
					return { ...node, data: { ...node.data, label } }
				}),
			)
		})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [graphNodes.length])

	// Handle focus error (invalid entity ID)
	useEffect(() => {
		if (focusId && focusQuery.isError) {
			setFocusError(`Entity "${focusId}" not found`)
		} else {
			setFocusError(null)
		}
	}, [focusId, focusQuery.isError])

	// Fetch TYPE relations for seed entities
	useEffect(() => {
		// Skip in focus mode or if already fetched
		if (focusId || seedTypeRelations || !seedQuery.entities?.entities) return

		const entities = seedQuery.entities.entities
		if (entities.length === 0) return

		// Batch fetch TYPE relations for all seed entities
		Promise.all(
			entities.map((entity) =>
				getEntityRelations(entity.id, { type: 'TYPE' })
					.then((res) => ({ entityId: entity.id, relations: res.relations ?? [] }))
					.catch(() => ({ entityId: entity.id, relations: [] })),
			),
		).then((results) => {
			const seenIds = new Set(entities.map((e) => e.id))
			const newNodes: GraphNode[] = []
			const newEdges: GraphEdge[] = []

			for (const { entityId, relations } of results) {
				for (const rel of relations) {
					// Add edge
					newEdges.push({
						id: `${rel.fromId}-${rel.toId}`,
						source: rel.fromId,
						target: rel.toId,
						type: rel.relationType,
					})

					// Add TYPE entity node if not exists
					const otherId = rel.fromId === entityId ? rel.toId : rel.fromId
					if (!seenIds.has(otherId)) {
						seenIds.add(otherId)
						newNodes.push({
							id: otherId,
							x: 0,
							y: 0,
							fixed: false,
						})
					}
				}
			}

			setSeedTypeRelations({ nodes: newNodes, edges: newEdges })
		})
	}, [focusId, seedQuery.entities, seedTypeRelations])

	// Click handler: navigate to entity detail (with delay to distinguish from double-click)
	const handleNodeClick = useCallback(
		(_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId

			// Clear any existing pending click
			if (pendingClick) {
				clearTimeout(pendingClick.timer)
			}

			// Start a timer - if no double-click occurs within 250ms, navigate
			const timer = setTimeout(() => {
				navigate(`/entities/${entityId}`)
				setPendingClick(null)
			}, 250)

			setPendingClick({ nodeId: node.id, timer })
		},
		[navigate, pendingClick],
	)

	// Double-click handler: expand neighbors
	const handleNodeDoubleClick = useCallback(
		async (_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId

			// Cancel any pending click navigation
			if (pendingClick) {
				clearTimeout(pendingClick.timer)
				setPendingClick(null)
			}

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
		[graphNodes, graphEdges, setNodes, setEdges, expandedNodes, pendingClick],
	)

	// Cleanup pending click timer on unmount
	useEffect(() => {
		return () => {
			if (pendingClick) {
				clearTimeout(pendingClick.timer)
			}
		}
	}, [pendingClick])

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
				<Card className="w-full max-w-md">
					<CardContent className="py-8">
						<div className="space-y-4">
							<Skeleton className="h-8 w-48 mx-auto" />
							<Skeleton className="h-64 w-full" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Error state
	if (isError || focusError) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<Card className="w-full max-w-md bg-red-50 ring-red-200">
					<CardContent className="py-8">
						<div className="text-center">
							<div className="text-red-600 mb-4">{focusError ?? 'Failed to load graph data'}</div>
							<Button variant="default" onClick={handleRetry}>
								Retry
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Empty state
	if (graphNodes.length === 0) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="py-8">
						<p className="text-center text-gray-500">
							No entities to display. Add some entities to see the graph.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="h-full w-full relative">
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
				preventScrolling={false}
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
							Click: view entity | Double-click: expand | Drag: pin | Ctrl+Scroll: zoom
						</div>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	)
}
