/**
 * Graph Page - Force-directed graph visualization using ReactFlow
 * Styled per Graphite design with overlay controls, legend, zoom, and inspector.
 *
 * Features:
 * - Overlay header with node/edge count
 * - Layout chips (2D / Force / Hierarchy — only Force active)
 * - Focus search box (top-right)
 * - Legend panel (left)
 * - Zoom controls (bottom-left: +/-/Fit/Focus)
 * - Node styling: dot indicator non-selected, solid accent bg + shadow selected
 * - Edge styling: gray default, accent on incident to selected
 * - Inspector panel on node select (right column)
 * - Preserved: click→navigate (250ms delay), double-click→expand, drag→pin, focus mode
 */

import {
	Background,
	type Connection,
	type EdgeChange,
	MarkerType,
	type NodeChange,
	ReactFlow,
	ReactFlowProvider,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getEntity, getEntityRelations } from '~/api/entities'
import {
	type EntityKind,
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
import { Chip } from '~/components/ui/chip'
import { Skeleton } from '~/components/ui/skeleton'
import { useEntities, useEntity, useEntityRelations, usePropertyNames } from '~/hooks/use-entities'
import {
	NAME_PROPERTY_ID,
	PROPERTY_ENTITY_ID,
	RELATION_ENTITY_ID,
	TYPE_ENTITY_ID,
} from '~/lib/constants'
import { cn } from '~/lib/utils'

// Custom node and edge types
const nodeTypes = { entity: EntityNode }
const edgeTypes = { relation: RelationEdge }

// Seed configuration
const SEED_LIMIT = 50
const SIMULATION_TICKS = 300

// ---------------------------------------------------------------------------
// Zoom controls sub-component
// ---------------------------------------------------------------------------

function ZoomControls() {
	const { zoomIn, zoomOut, fitView } = useReactFlow()

	return (
		<div className="flex flex-col gap-1 z-10">
			<button
				type="button"
				onClick={() => zoomIn({ duration: 200 })}
				className="w-[26px] h-[26px] border border-border bg-card text-[#3f3f46] rounded-[5px] cursor-pointer grid place-items-center text-sm font-mono"
				aria-label="Zoom in"
			>
				+
			</button>
			<button
				type="button"
				onClick={() => zoomOut({ duration: 200 })}
				className="w-[26px] h-[26px] border border-border bg-card text-[#3f3f46] rounded-[5px] cursor-pointer grid place-items-center text-sm font-mono"
				aria-label="Zoom out"
			>
				−
			</button>
			<button
				type="button"
				onClick={() => fitView({ duration: 200, padding: 0.2 })}
				className="w-[26px] h-[26px] border border-border bg-card text-[#3f3f46] rounded-[5px] cursor-pointer grid place-items-center"
				aria-label="Fit view"
			>
				<svg width="11" height="11" viewBox="0 0 12 12" role="img" aria-label="Fit view">
					<path
						d="M2 4V2h2M8 2h2v2M10 8v2H8M4 10H2V8"
						stroke="currentColor"
						strokeWidth="1.3"
						fill="none"
						strokeLinecap="round"
					/>
				</svg>
			</button>
			<button
				type="button"
				onClick={() => {
					const input = document.querySelector<HTMLInputElement>('[data-testid="focus-search"]')
					input?.focus()
				}}
				className="w-[26px] h-[26px] border border-border bg-card text-[#3f3f46] rounded-[5px] cursor-pointer grid place-items-center"
				aria-label="Focus node"
			>
				<svg width="11" height="11" viewBox="0 0 12 12" role="img" aria-label="Focus node">
					<path
						d="M4 6V3a2 2 0 0 1 4 0v3M3 6h6v4H3z"
						stroke="currentColor"
						strokeWidth="1.3"
						fill="none"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Inspector panel sub-component
// ---------------------------------------------------------------------------

interface InspectorProps {
	entityId: string
	label: string | undefined
	kind: EntityKind
	relatedNodeIds: string[]
	nodeLabels: Map<string, string | undefined>
	nodeKinds: Map<string, EntityKind>
	inDegree: number
	outDegree: number
	isPinned: boolean
	onClose: () => void
	onOpen: () => void
	onExpand: () => void
	onTogglePin: () => void
	onSelectNeighbor: (id: string) => void
}

function InspectorPanel({
	entityId,
	label,
	kind,
	relatedNodeIds,
	nodeLabels,
	nodeKinds,
	inDegree,
	outDegree,
	isPinned,
	onClose,
	onOpen,
	onExpand,
	onTogglePin,
	onSelectNeighbor,
}: InspectorProps) {
	const truncatedId =
		entityId.length > 16 ? `${entityId.slice(0, 8)}…${entityId.slice(-6)}` : entityId

	const kindDotColor =
		kind === 'Property' ? 'bg-warning' : kind === 'Type' ? 'bg-purple' : 'bg-accent'

	return (
		<div className="bg-card border border-border rounded-lg overflow-auto flex flex-col">
			{/* Header */}
			<div className="px-4 py-3.5 border-b border-border">
				<div className="flex items-center gap-2 mb-1.5">
					<span className={cn('w-[7px] h-[7px] rounded-full', kindDotColor)} />
					<span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
						{kind}
					</span>
					<div className="flex-1" />
					<button
						type="button"
						onClick={onClose}
						className="border-none bg-transparent text-muted-foreground/60 cursor-pointer w-[18px] h-[18px] rounded-full grid place-items-center"
						aria-label="Close inspector"
					>
						<svg width="10" height="10" viewBox="0 0 10 10" role="img" aria-label="Close">
							<path
								d="M1 1l8 8M9 1l-8 8"
								stroke="currentColor"
								strokeWidth="1.3"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
				<div className="text-[19px] font-semibold tracking-tight">{label ?? truncatedId}</div>
				<div className="font-mono text-xs text-muted-foreground mt-0.5">{truncatedId}</div>
				<div className="flex gap-1.5 mt-3">
					<InspectorButton
						onClick={onOpen}
						icon={
							<svg width="12" height="12" viewBox="0 0 14 14" role="img" aria-label="Open">
								<path
									d="M7 3l4 4-4 4M3 7h8"
									stroke="currentColor"
									strokeWidth="1.3"
									fill="none"
									strokeLinecap="round"
								/>
							</svg>
						}
					>
						Open
					</InspectorButton>
					<InspectorButton
						onClick={onExpand}
						icon={
							<svg width="12" height="12" viewBox="0 0 14 14" role="img" aria-label="Expand">
								<circle cx="4" cy="4" r="1.4" stroke="currentColor" fill="none" strokeWidth="1.2" />
								<circle
									cx="10"
									cy="10"
									r="1.4"
									stroke="currentColor"
									fill="none"
									strokeWidth="1.2"
								/>
								<path d="M5 5l4 4" stroke="currentColor" strokeWidth="1.2" />
							</svg>
						}
					>
						Expand
					</InspectorButton>
					<InspectorButton onClick={onTogglePin}>{isPinned ? 'Unpin' : 'Pin'}</InspectorButton>
				</div>
			</div>

			{/* Neighbors */}
			<div className="px-4 py-3 border-b border-border">
				<div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
					Neighbors · {relatedNodeIds.length}
				</div>
				{relatedNodeIds.slice(0, 6).map((nid) => {
					const nLabel = nodeLabels.get(nid)
					const nKind = nodeKinds.get(nid) ?? 'Entity'
					const nDotColor =
						nKind === 'Property' ? 'bg-warning' : nKind === 'Type' ? 'bg-purple' : 'bg-accent'
					return (
						<button
							key={nid}
							type="button"
							onClick={() => onSelectNeighbor(nid)}
							className="flex items-center gap-2 py-[5px] w-full text-left cursor-pointer bg-transparent border-none"
						>
							<span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', nDotColor)} />
							<span className="text-xs text-[#3f3f46] flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
								{nLabel ?? nid}
							</span>
							<span className="text-xs text-muted-foreground/60">{nKind.toLowerCase()}</span>
						</button>
					)
				})}
			</div>

			{/* Degree */}
			<div className="px-4 py-3">
				<div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
					Degree
				</div>
				<div className="flex gap-3.5 text-xs">
					<div>
						<span className="text-muted-foreground">In </span>
						<span className="font-mono font-medium">{inDegree}</span>
					</div>
					<div>
						<span className="text-muted-foreground">Out </span>
						<span className="font-mono font-medium">{outDegree}</span>
					</div>
				</div>
			</div>
		</div>
	)
}

function InspectorButton({
	children,
	onClick,
	icon,
}: {
	children: React.ReactNode
	onClick: () => void
	icon?: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-1.5 px-2 py-[3px] border border-border bg-card text-[#18181b] rounded-md text-xs cursor-pointer font-medium"
		>
			{icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
			{children}
		</button>
	)
}

// ---------------------------------------------------------------------------
// Main GraphPage component
// ---------------------------------------------------------------------------

export function GraphPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const focusId = searchParams.get('focus')

	// Track if we're in an error state for focus mode
	const [focusError, setFocusError] = useState<string | null>(null)

	// Track expanded node IDs to prevent re-expanding
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

	// Selected node for inspector
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

	// Focus search input
	const [focusInput, setFocusInput] = useState('')

	// Entity kind map (entityId → EntityKind)
	const [entityKinds, setEntityKinds] = useState<Map<string, EntityKind>>(new Map())

	// Node labels map
	const [nodeLabels, setNodeLabels] = useState<Map<string, string | undefined>>(new Map())

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

	// Resolve relation type property names for graph edges
	const relationTypeIds = useMemo(() => [...new Set(graphEdges.map((e) => e.type))], [graphEdges])
	const { names: propertyDisplayNames } = usePropertyNames(relationTypeIds)
	const propertyDisplayNamesRef = useRef(propertyDisplayNames)
	propertyDisplayNamesRef.current = propertyDisplayNames

	// Selected node related IDs (for highlighting)
	const selectedRelatedIds = useMemo(() => {
		if (!selectedNodeId) return new Set<string>()
		const related = new Set<string>()
		for (const e of graphEdges) {
			const src = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id
			const tgt = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id
			if (src === selectedNodeId) related.add(tgt)
			if (tgt === selectedNodeId) related.add(src)
		}
		return related
	}, [selectedNodeId, graphEdges])

	// Update edge labels when property names resolve
	useEffect(() => {
		if (propertyDisplayNames.size === 0) return

		setEdges((prev) => {
			let changed = false
			const next = prev.map((edge): RelationEdgeType => {
				const relationType = edge.data?.relationType ?? ''
				const resolvedName = propertyDisplayNames.get(relationType)
				if (resolvedName === edge.data?.propertyDisplayName) return edge
				changed = true
				return {
					...edge,
					data: {
						relationType: edge.data?.relationType ?? '',
						propertyDisplayName: resolvedName,
						incident: edge.data?.incident,
						dimmed: edge.data?.dimmed,
					},
				}
			})
			return changed ? next : prev
		})
	}, [propertyDisplayNames, setEdges])

	// Update node/edge styling when selection changes
	useEffect(() => {
		if (graphNodes.length === 0) return

		// Update nodes: set dimmed + isSelected state
		setNodes((prev) => {
			let changed = false
			const next = prev.map((node) => {
				const dimmed = selectedNodeId
					? node.data.entityId !== selectedNodeId && !selectedRelatedIds.has(node.data.entityId)
					: false
				const kind = entityKinds.get(node.data.entityId) ?? 'Entity'
				const isSelected = node.data.entityId === selectedNodeId
				if (
					node.data.dimmed === dimmed &&
					node.data.kind === kind &&
					node.data.isSelected === isSelected
				)
					return node
				changed = true
				return { ...node, data: { ...node.data, dimmed, kind, isSelected } }
			})
			return changed ? next : prev
		})

		// Update edges: set incident/dimmed state
		setEdges((prev) => {
			let changed = false
			const next = prev.map((edge): RelationEdgeType => {
				const incident = selectedNodeId
					? edge.source === selectedNodeId || edge.target === selectedNodeId
					: false
				const dimmed = selectedNodeId ? !incident : false
				if (edge.data?.incident === incident && edge.data?.dimmed === dimmed) return edge
				changed = true
				return {
					...edge,
					data: {
						relationType: edge.data?.relationType ?? '',
						propertyDisplayName: edge.data?.propertyDisplayName,
						incident,
						dimmed,
					},
				}
			})
			return changed ? next : prev
		})
	}, [selectedNodeId, selectedRelatedIds, graphNodes.length, entityKinds, setNodes, setEdges])

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
		const radius = 200

		const nodes: GraphNode[] = entities.map((e, i) => {
			const angle = (2 * Math.PI * i) / count
			return {
				id: e.id,
				x: radius * Math.cos(angle),
				y: radius * Math.sin(angle),
				fixed: false,
			}
		})

		if (seedTypeRelations) {
			nodes.push(...seedTypeRelations.nodes)
		}

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

		const simNodes = seedNodes.map((n) => ({ ...n }))
		const simEdges = seedEdges.map((e) => ({ ...e }))

		if (simNodes.length > 0) {
			const simulation = createSimulation(simNodes, simEdges)
			simulation.tick(SIMULATION_TICKS)
			simulation.stop()

			const rfNodes = simNodes.map((n, i) => toReactFlowNode(n, i))
			const rfEdges = simEdges.map((e) => ({
				...toReactFlowEdge(e, propertyDisplayNamesRef.current),
				markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
			}))

			setGraphNodes(simNodes)
			setGraphEdges(simEdges)
			setNodes(rfNodes)
			setEdges(rfEdges)
		}
	}, [seedGraphData, graphNodes.length, setNodes, setEdges])

	// When TYPE relations arrive after initial seed nodes, add edges + type nodes
	useEffect(() => {
		if (!seedTypeRelations || graphNodes.length === 0) return
		if (focusId) return

		// Check if these edges are already in the graph
		const existingEdgeIds = new Set(graphEdges.map((e) => e.id))
		const newEdges = seedTypeRelations.edges.filter((e) => !existingEdgeIds.has(e.id))
		if (newEdges.length === 0) return

		// Check for new nodes (TYPE targets not yet in graph)
		const existingNodeIds = new Set(graphNodes.map((n) => n.id))
		const newNodes = seedTypeRelations.nodes.filter((n) => !existingNodeIds.has(n.id))

		if (newNodes.length === 0 && newEdges.length === 0) return

		// Place new nodes near center with random offset
		const placedNewNodes = newNodes.map((n) => ({
			...n,
			x: (Math.random() - 0.5) * 100,
			y: (Math.random() - 0.5) * 100,
		}))

		const allNodes = [...graphNodes, ...placedNewNodes]
		const allEdges = [...graphEdges, ...newEdges]

		// Re-run simulation with updated data
		const simNodes = allNodes.map((n) => ({ ...n }))
		const simEdges = allEdges.map((e) => ({ ...e }))
		const simulation = createSimulation(simNodes, simEdges)
		simulation.tick(SIMULATION_TICKS)
		simulation.stop()

		const rfNodes = simNodes.map((n, i) => toReactFlowNode(n, i))
		const rfEdges = simEdges.map((e) => ({
			...toReactFlowEdge(e, propertyDisplayNamesRef.current),
			markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
		}))

		setGraphNodes(simNodes)
		setGraphEdges(simEdges)
		setNodes(rfNodes)
		setEdges(rfEdges)
	}, [seedTypeRelations, graphNodes, graphEdges, focusId, setNodes, setEdges])

	// Fetch entity names + types and inject into ReactFlow nodes
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
						// Determine kind from TYPE relations
						const outRels = entity?.outgoing ?? []
						const typeTargets = outRels.filter((r) => r.relationType === 'TYPE').map((r) => r.toId)
						const kind: EntityKind = typeTargets.includes(PROPERTY_ENTITY_ID)
							? 'Property'
							: typeTargets.includes(TYPE_ENTITY_ID) || typeTargets.includes(RELATION_ENTITY_ID)
								? 'Type'
								: 'Entity'
						return {
							id,
							label: (nameTriple?.value.value as string | undefined) ?? undefined,
							kind,
						}
					})
					.catch(() => ({ id, label: undefined, kind: 'Entity' as EntityKind })),
			),
		).then((results) => {
			if (cancelled) return
			const labelMap = new Map(results.map((r) => [r.id, r.label]))
			const kindMap = new Map(results.map((r) => [r.id, r.kind]))
			setNodeLabels(labelMap)
			setEntityKinds(kindMap)
			setNodes((prev) =>
				prev.map((node) => {
					const label = labelMap.get(node.data.entityId)
					const kind = kindMap.get(node.data.entityId) ?? 'Entity'
					if (label === undefined || (node.data.label === label && node.data.kind === kind))
						return node
					return { ...node, data: { ...node.data, label, kind } }
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
		if (focusId || seedTypeRelations || !seedQuery.entities?.entities) return

		const entities = seedQuery.entities.entities
		if (entities.length === 0) return

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
					newEdges.push({
						id: `${rel.fromId}-${rel.toId}`,
						source: rel.fromId,
						target: rel.toId,
						type: rel.relationType,
					})

					const otherId = rel.fromId === entityId ? rel.toId : rel.fromId
					if (!seenIds.has(otherId)) {
						seenIds.add(otherId)
						newNodes.push({ id: otherId, x: 0, y: 0, fixed: false })
					}
				}
			}

			setSeedTypeRelations({ nodes: newNodes, edges: newEdges })
		})
	}, [focusId, seedQuery.entities, seedTypeRelations])

	// Click handler: select node and show inspector (no navigation)
	const handleNodeClick = useCallback((_event: React.MouseEvent, node: EntityNodeType) => {
		const entityId = node.data.entityId
		setSelectedNodeId(entityId)
	}, [])

	// Double-click handler: navigate to entity detail
	const handleNodeDoubleClick = useCallback(
		async (_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId

			// Navigate to entity detail page
			navigate(`/entities/${entityId}`)

			// Skip if already expanded
			if (expandedNodes.has(entityId)) return

			try {
				const data = await getEntityRelations(entityId)
				const relations = data.relations ?? []
				if (relations.length === 0) return

				const existingIds = new Set(graphNodes.map((n) => n.id))
				const newNodes: GraphNode[] = []
				const newEdges: GraphEdge[] = []

				for (const rel of relations) {
					const otherId = rel.fromId === entityId ? rel.toId : rel.fromId

					newEdges.push({
						id: `${rel.fromId}-${rel.toId}`,
						source: rel.fromId,
						target: rel.toId,
						type: rel.relationType,
					})

					if (!existingIds.has(otherId)) {
						existingIds.add(otherId)
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
					const allGraphEdges = [...graphEdges, ...newEdges]
					setGraphEdges(allGraphEdges)

					const rfEdges = allGraphEdges.map((e) => ({
						...toReactFlowEdge(e, propertyDisplayNamesRef.current),
						markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
					}))
					setEdges(rfEdges)
				} else if (newNodes.length > 0) {
					const allNodes = [...graphNodes, ...newNodes]
					const allEdges = [...graphEdges, ...newEdges]

					const simulation = createSimulation(allNodes, allEdges)
					simulation.tick(SIMULATION_TICKS)
					simulation.stop()

					setGraphNodes(allNodes)
					setGraphEdges(allEdges)

					const rfNodes = allNodes.map((n, i) => toReactFlowNode(n, i))
					const rfEdges = allEdges.map((e) => ({
						...toReactFlowEdge(e, propertyDisplayNamesRef.current),
						markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
					}))

					setNodes(rfNodes)
					setEdges(rfEdges)
				}

				setExpandedNodes((prev) => new Set(prev).add(entityId))
			} catch {
				// Silently ignore expansion errors
			}
		},
		[graphNodes, graphEdges, setNodes, setEdges, expandedNodes, navigate],
	)

	// Drag handler: pin node position
	const handleNodeDragStop = useCallback(
		(_event: React.MouseEvent, node: EntityNodeType) => {
			const entityId = node.data.entityId
			const graphNode = graphNodes.find((n) => n.id === entityId)

			if (graphNode) {
				setNodePosition(graphNode, node.position.x, node.position.y)
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

	// Handle new connections
	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((eds) => addEdge(connection, eds))
		},
		[setEdges],
	)

	// Focus search submit
	const handleFocusSearch = useCallback(() => {
		const id = focusInput.trim()
		if (id) {
			setSearchParams({ focus: id })
		}
	}, [focusInput, setSearchParams])

	// Retry handler
	const handleRetry = useCallback(() => {
		if (focusId) {
			focusQuery.refetch()
			focusRelationsQuery.refetch()
		} else {
			seedQuery.refetch()
		}
	}, [focusId, focusQuery, focusRelationsQuery, seedQuery])

	// Inspector handlers
	const handleInspectorClose = useCallback(() => {
		setSelectedNodeId(null)
	}, [])

	const handleInspectorOpen = useCallback(() => {
		if (selectedNodeId) {
			navigate(`/entities/${selectedNodeId}`)
		}
	}, [selectedNodeId, navigate])

	const handleInspectorExpand = useCallback(async () => {
		if (!selectedNodeId || expandedNodes.has(selectedNodeId)) return

		try {
			const data = await getEntityRelations(selectedNodeId)
			const relations = data.relations ?? []
			if (relations.length === 0) return

			const existingIds = new Set(graphNodes.map((n) => n.id))
			const newNodes: GraphNode[] = []
			const newEdges: GraphEdge[] = []

			for (const rel of relations) {
				const otherId = rel.fromId === selectedNodeId ? rel.toId : rel.fromId

				newEdges.push({
					id: `${rel.fromId}-${rel.toId}`,
					source: rel.fromId,
					target: rel.toId,
					type: rel.relationType,
				})

				if (!existingIds.has(otherId)) {
					existingIds.add(otherId)
					const sourceNode = graphNodes.find((n) => n.id === selectedNodeId)
					newNodes.push({
						id: otherId,
						x: (sourceNode?.x ?? 0) + (Math.random() - 0.5) * 100,
						y: (sourceNode?.y ?? 0) + (Math.random() - 0.5) * 100,
						fixed: false,
					})
				}
			}

			if (newNodes.length > 0) {
				const allNodes = [...graphNodes, ...newNodes]
				const allEdges = [...graphEdges, ...newEdges]

				const simulation = createSimulation(allNodes, allEdges)
				simulation.tick(SIMULATION_TICKS)
				simulation.stop()

				setGraphNodes(allNodes)
				setGraphEdges(allEdges)

				const rfNodes = allNodes.map((n, i) => toReactFlowNode(n, i))
				const rfEdges = allEdges.map((e) => ({
					...toReactFlowEdge(e, propertyDisplayNamesRef.current),
					markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
				}))

				setNodes(rfNodes)
				setEdges(rfEdges)
			} else if (newEdges.length > 0) {
				const allGraphEdges = [...graphEdges, ...newEdges]
				setGraphEdges(allGraphEdges)
				const rfEdges = allGraphEdges.map((e) => ({
					...toReactFlowEdge(e, propertyDisplayNamesRef.current),
					markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' },
				}))
				setEdges(rfEdges)
			}

			setExpandedNodes((prev) => new Set(prev).add(selectedNodeId))
		} catch {
			// Ignore
		}
	}, [selectedNodeId, expandedNodes, graphNodes, graphEdges, setNodes, setEdges])

	const handleInspectorTogglePin = useCallback(() => {
		if (!selectedNodeId) return
		const graphNode = graphNodes.find((n) => n.id === selectedNodeId)
		if (graphNode) {
			if (graphNode.fixed) {
				graphNode.fx = null
				graphNode.fy = null
				graphNode.fixed = false
			} else {
				graphNode.fx = graphNode.x
				graphNode.fy = graphNode.y
				graphNode.fixed = true
			}
			setGraphNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? graphNode : n)))
			// Update draggable
			setNodes((prev) =>
				prev.map((n) =>
					n.data.entityId === selectedNodeId ? { ...n, draggable: !graphNode.fixed } : n,
				),
			)
		}
	}, [selectedNodeId, graphNodes, setNodes])

	const handleSelectNeighbor = useCallback((id: string) => {
		setSelectedNodeId(id)
	}, [])

	// Selected node data for inspector
	const selectedNode = selectedNodeId
		? {
				entityId: selectedNodeId,
				label: nodeLabels.get(selectedNodeId),
				kind: entityKinds.get(selectedNodeId) ?? ('Entity' as EntityKind),
				relatedIds: [...selectedRelatedIds],
				inDegree: graphEdges.filter((e) => {
					const tgt = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id
					return tgt === selectedNodeId
				}).length,
				outDegree: graphEdges.filter((e) => {
					const src = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id
					return src === selectedNodeId
				}).length,
				isPinned: graphNodes.find((n) => n.id === selectedNodeId)?.fixed ?? false,
			}
		: null

	// Loading state
	if (isLoading) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="w-full max-w-md space-y-4">
					<Skeleton className="h-8 w-48 mx-auto" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		)
	}

	// Error state
	if (isError || focusError) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="bg-card border border-destructive/30 rounded-lg p-8 text-center max-w-md">
					<div className="text-destructive mb-4">{focusError ?? 'Failed to load graph data'}</div>
					<Button variant="default" onClick={handleRetry}>
						Retry
					</Button>
				</div>
			</div>
		)
	}

	// Empty state
	if (graphNodes.length === 0) {
		return (
			<div className="p-6 h-full flex items-center justify-center">
				<div className="bg-card border border-border rounded-lg p-8 text-center max-w-md">
					<p className="text-muted-foreground">No entities to display</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className="h-full w-full p-3.5 pl-4 pr-4 pb-4"
			style={{ maxWidth: 1600, margin: '0 auto' }}
		>
			<div
				className="grid gap-3 h-full"
				style={{
					gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr',
				}}
			>
				{/* Main canvas */}
				<div className="relative bg-card border border-border rounded-lg overflow-hidden">
					{/* Dot grid background */}
					<div
						className="absolute inset-0 pointer-events-none z-0"
						style={{
							backgroundImage:
								'radial-gradient(circle at center, var(--line-soft) 1px, transparent 1px)',
							backgroundSize: '16px 16px',
						}}
					/>

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
						proOptions={{ hideAttribution: true }}
					>
						<Background color="transparent" />
					</ReactFlow>

					{/* Overlay header */}
					<div className="absolute top-3 left-3 right-3 flex items-center gap-2.5 z-10">
						<div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2.5">
							<div className="text-[20px] font-semibold">Graph</div>
							<span className="font-mono text-xs text-muted-foreground">
								{graphNodes.length} nodes · {graphEdges.length} edges
							</span>
						</div>

						{/* Layout chips */}
						<div className="bg-card border border-border rounded-lg p-1 flex gap-0.5">
							<Chip active={false} disabled>
								2D
							</Chip>
							<Chip active>Force</Chip>
							<Chip active={false} disabled>
								Hierarchy
							</Chip>
						</div>

						<div className="flex-1" />

						{/* Focus search */}
						<div className="bg-card border border-border rounded-lg px-2 py-1 flex items-center gap-1.5">
							<svg
								width="12"
								height="12"
								viewBox="0 0 14 14"
								className="text-muted-foreground"
								role="img"
								aria-label="Search"
							>
								<circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2" />
								<path
									d="M9.2 9.2l3 3"
									stroke="currentColor"
									strokeWidth="1.2"
									strokeLinecap="round"
								/>
							</svg>
							<input
								data-testid="focus-search"
								placeholder="Focus node…"
								value={focusInput}
								onChange={(e) => setFocusInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleFocusSearch()
									if (e.key === 'Escape') setFocusInput('')
								}}
								className="border-none outline-none bg-transparent text-xs w-[120px]"
							/>
						</div>
					</div>

					{/* Legend */}
					<div className="absolute top-[62px] left-3 bg-card border border-border rounded-lg px-2.5 py-2 z-10 text-xs">
						<div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1.5">
							Legend
						</div>
						<div className="flex items-center gap-1.5 py-0.5">
							<span className="w-[6px] h-[6px] rounded-full bg-accent" />
							<span className="text-[#3f3f46]">Entity</span>
						</div>
						<div className="flex items-center gap-1.5 py-0.5">
							<span className="w-[6px] h-[6px] rounded-full bg-warning" />
							<span className="text-[#3f3f46]">Property</span>
						</div>
						<div className="flex items-center gap-1.5 py-0.5">
							<span className="w-[6px] h-[6px] rounded-full bg-purple" />
							<span className="text-[#3f3f46]">Type</span>
						</div>
					</div>

					{/* Zoom controls */}
					<div className="absolute bottom-3.5 left-3.5 z-10">
						<ZoomControls />
					</div>
				</div>

				{/* Inspector panel */}
				{selectedNode && (
					<InspectorPanel
						entityId={selectedNode.entityId}
						label={selectedNode.label}
						kind={selectedNode.kind}
						relatedNodeIds={selectedNode.relatedIds}
						nodeLabels={nodeLabels}
						nodeKinds={entityKinds}
						inDegree={selectedNode.inDegree}
						outDegree={selectedNode.outDegree}
						isPinned={selectedNode.isPinned}
						onClose={handleInspectorClose}
						onOpen={handleInspectorOpen}
						onExpand={handleInspectorExpand}
						onTogglePin={handleInspectorTogglePin}
						onSelectNeighbor={handleSelectNeighbor}
					/>
				)}
			</div>
		</div>
	)
}

/**
 * Wrapped export with ReactFlowProvider for proper hook context.
 * Required because ZoomControls uses useReactFlow() which needs the provider.
 */
export function GraphPageWithProvider() {
	return (
		<ReactFlowProvider>
			<GraphPage />
		</ReactFlowProvider>
	)
}
