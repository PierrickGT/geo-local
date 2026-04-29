import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { Entity, SearchResult } from '~/api/types'
import { Chip } from '~/components/ui/chip'
import { Kbd } from '~/components/ui/kbd'
import { useSearch } from '~/hooks/use-search'

/**
 * Search page restyled with Graphite design.
 * - Big search bar panel (not thin input) with SVG icon, clear button, ⌘K hint
 * - 5 scope chips row (All scopes / Names / Descriptions / Property values / IDs)
 * - Empty state with dashed border panel + suggestions
 * - Name-mode: "Text matches" table with <mark> highlighting
 * - ID-mode: triggered by 6+ hex chars, shows "Matching entities" single-row
 * - No results state with safely rendered query
 * - Clear button resets input, removes ?q=
 * - URL sync: ?q= pre-fills, new query updates URL
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCOPE_CHIPS = ['All scopes', 'Names', 'Descriptions', 'Property values', 'IDs'] as const
type ScopeChip = (typeof SCOPE_CHIPS)[number]

const SUGGESTIONS = ['Action Code', 'Lab Certification', 'URL', '021ccf86']

const HEX_PATTERN = /^[0-9a-f]{6,}$/i

// ---------------------------------------------------------------------------
// Highlight helper — returns React nodes (safe, no dangerouslySetInnerHTML)
// ---------------------------------------------------------------------------

function HighlightedText({ text, query }: { text: string; query: string }) {
	if (!query) return <>{text}</>
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const parts = text.split(new RegExp(`(${escaped})`, 'ig'))

	// Use content-derived keys to satisfy lint rule
	const elements = parts.map((part, i) => {
		const isMatch = part.toLowerCase() === query.toLowerCase()
		const key = `${isMatch ? 'm' : 't'}-${part.slice(0, 8)}-${i}`
		return isMatch ? (
			<mark key={key} className="bg-[#fef08a] text-[#713f12] px-[2px] rounded-[2px]">
				{part}
			</mark>
		) : (
			<span key={key}>{part}</span>
		)
	})

	return <>{elements}</>
}

// ---------------------------------------------------------------------------
// Format value for display
// ---------------------------------------------------------------------------

function formatValue(value: { value: unknown }): string {
	const v = value.value
	if (typeof v === 'string') {
		return v.length > 200 ? `${v.slice(0, 200)}…` : v
	}
	if (typeof v === 'number' || typeof v === 'boolean') {
		return String(v)
	}
	return JSON.stringify(v)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [activeScope, setActiveScope] = useState<ScopeChip>('All scopes')

	// Get query from URL
	const query = searchParams.get('q') ?? ''

	// Determine mode
	const isId = HEX_PATTERN.test(query.trim())
	const isName = query.trim().length > 0 && !isId

	// Debounced search via hook
	const { results, isLoading, isDebouncing, isError, error, refetch } = useSearch({
		q: query,
		debounceMs: 300,
	})

	const isSearching = isLoading || isDebouncing
	const entityResults = results?.entities ?? []
	const textResults = results?.results ?? []
	const hasAnyResults = entityResults.length > 0 || textResults.length > 0
	const hasNoResults = results && !hasAnyResults
	const isEmptyQuery = !query.trim()

	// Update URL when query changes
	const handleQueryChange = (newQuery: string) => {
		const newParams = new URLSearchParams(searchParams)
		if (newQuery.trim()) {
			newParams.set('q', newQuery)
		} else {
			newParams.delete('q')
		}
		setSearchParams(newParams, { replace: true })
	}

	const handleClear = () => {
		handleQueryChange('')
	}

	const handleSuggestionClick = (suggestion: string) => {
		handleQueryChange(suggestion)
	}

	const handleOpenEntity = (entityId: string) => {
		navigate(`/entities/${encodeURIComponent(entityId)}`)
	}

	return (
		<div className="p-[18px_20px_24px] max-w-[1200px] mx-auto">
			{/* Header */}
			<div className="mb-3.5">
				<div className="text-[24px] font-semibold tracking-[-0.5px]">Search</div>
				<div className="text-xs text-muted-foreground mt-1">
					Query across names, IDs, and property values
				</div>
			</div>

			{/* Big search bar panel */}
			<div className="bg-card border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2.5 mb-2.5">
				{/* Search icon */}
				<svg
					width="16"
					height="16"
					viewBox="0 0 14 14"
					aria-hidden="true"
					className="text-muted-foreground shrink-0"
				>
					<circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2" />
					<path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
				</svg>
				<input
					type="search"
					aria-label="Search"
					value={query}
					onChange={(e) => handleQueryChange(e.target.value)}
					placeholder="Search by name, property value, or paste a 32-char id…"
					className={`flex-1 border-none outline-none bg-transparent text-sm text-foreground ${isId ? 'font-mono' : ''}`}
				/>
				{/* Clear button */}
				{query && (
					<button
						type="button"
						aria-label="Clear search"
						onClick={handleClear}
						className="border-none bg-line-soft text-muted-foreground w-5 h-5 rounded-full cursor-pointer grid place-items-center shrink-0"
					>
						<svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
							<path
								d="M1 1l7 7M8 1l-7 7"
								stroke="currentColor"
								strokeWidth="1.3"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				)}
				{/* ⌘K hint */}
				<Kbd>⌘K</Kbd>
			</div>

			{/* Scope chips row */}
			<div className="flex gap-1.5 mb-4">
				{SCOPE_CHIPS.map((chip) => (
					<Chip key={chip} active={activeScope === chip} onClick={() => setActiveScope(chip)}>
						{chip}
					</Chip>
				))}
			</div>

			{/* Error state */}
			{isError && (
				<div className="bg-card border border-destructive/20 rounded-lg p-4 mb-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-destructive">
								{error?.message || 'An unexpected error occurred'}
							</p>
						</div>
						<button
							type="button"
							onClick={() => refetch()}
							className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 cursor-pointer"
						>
							Retry
						</button>
					</div>
				</div>
			)}

			{/* Loading state */}
			{isSearching && !isError && (
				<div className="bg-card border border-border rounded-lg p-8">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
						<span className="ml-3 text-muted-foreground text-sm">Searching…</span>
					</div>
				</div>
			)}

			{/* Empty state with suggestions */}
			{isEmptyQuery && !isSearching && !isError && (
				<div
					data-testid="search-empty-state"
					className="bg-card border border-dashed border-border rounded-lg py-11 px-5 text-center"
				>
					{/* Search icon in circle */}
					<div className="w-9 h-9 rounded-full bg-line-soft mx-auto mb-2.5 grid place-items-center">
						<svg
							width="16"
							height="16"
							viewBox="0 0 14 14"
							aria-hidden="true"
							className="text-muted-foreground"
						>
							<circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2" />
							<path
								d="M9.2 9.2l3 3"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
							/>
						</svg>
					</div>
					<div className="text-sm font-medium">Find entities across the graph</div>
					<div className="text-xs text-muted-foreground mt-1 mb-[18px]">
						Enter a name, a property value, or paste a full 32-character id.
					</div>
					<div className="flex gap-2 justify-center flex-wrap">
						{SUGGESTIONS.map((suggestion) => (
							<button
								key={suggestion}
								type="button"
								onClick={() => handleSuggestionClick(suggestion)}
								className={`border border-border bg-background px-2.5 py-[5px] rounded-md text-xs cursor-pointer ${suggestion.startsWith('021') ? 'font-mono' : ''}`}
							>
								{suggestion}
							</button>
						))}
					</div>
				</div>
			)}

			{/* No results state */}
			{hasNoResults && !isSearching && !isError && (
				<div className="bg-card border border-border rounded-lg p-6 text-center">
					<div className="text-sm font-medium mb-1">No results found</div>
					<div className="text-xs text-muted-foreground">No entities matching "{query}"</div>
				</div>
			)}

			{/* ID-mode results: "Matching entities" */}
			{isId && entityResults.length > 0 && !isSearching && !isError && (
				<div className="bg-card border border-border rounded-lg overflow-hidden">
					{/* Header */}
					<div className="px-3.5 py-2.5 border-b border-border bg-[#fcfcfb] flex items-center gap-2">
						<span className="text-xs font-medium">Matching entities</span>
						<span className="font-mono text-xs text-muted-foreground">{entityResults.length}</span>
					</div>
					{/* Entity rows */}
					{entityResults.map((entity) => (
						<EntityIdRow key={entity.id} entity={entity} query={query} onOpen={handleOpenEntity} />
					))}
				</div>
			)}

			{/* Name-mode results: "Text matches" */}
			{isName && textResults.length > 0 && !isSearching && !isError && (
				<div className="bg-card border border-border rounded-lg overflow-hidden">
					{/* Header */}
					<div className="px-3.5 py-2.5 border-b border-border bg-[#fcfcfb] flex items-center gap-2">
						<span className="text-xs font-medium">Text matches</span>
						<span className="font-mono text-xs text-muted-foreground">{textResults.length}</span>
						<div className="flex-1" />
						<span className="text-xs text-muted-foreground">Grouped by entity</span>
					</div>
					{/* Column headers */}
					<div className="grid grid-cols-[240px_180px_1fr_80px] px-3.5 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-[0.6px] font-semibold">
						<div>Entity</div>
						<div>Property</div>
						<div>Value</div>
						<div />
					</div>
					{/* Result rows */}
					{textResults.map((result, index) => (
						<TextMatchRow
							key={`${result.entityId}-${result.propertyId}-${index}`}
							result={result}
							query={query}
							onOpen={handleOpenEntity}
							isLast={index === textResults.length - 1}
						/>
					))}
				</div>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EntityIdRow({
	entity,
	query,
	onOpen,
}: {
	entity: Entity
	query: string
	onOpen: (id: string) => void
}) {
	return (
		<div className="px-3.5 py-3 grid grid-cols-[340px_1fr_auto] gap-4 items-center">
			<span className="font-mono text-xs text-[#3f3f46]">{query}</span>
			<div className="flex items-center gap-2">
				<span className="w-[5px] h-[5px] rounded-full bg-warning shrink-0" />
				<span className="font-medium">
					{entity.propertiesText ?? <span className="italic text-muted-foreground">No name</span>}
				</span>
			</div>
			<button
				type="button"
				onClick={() => onOpen(entity.id)}
				className="border border-border bg-card px-2.5 py-[3px] rounded-[5px] text-xs cursor-pointer"
			>
				Open →
			</button>
		</div>
	)
}

function TextMatchRow({
	result,
	query,
	onOpen,
	isLast,
}: {
	result: SearchResult
	query: string
	onOpen: (id: string) => void
	isLast: boolean
}) {
	const valueText = formatValue(result.value)

	return (
		<div
			className={`grid grid-cols-[240px_180px_1fr_80px] px-3.5 py-2.5 items-center gap-2.5 ${isLast ? '' : 'border-b border-line-soft'}`}
		>
			{/* Entity column */}
			<div className="min-w-0">
				<div className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
					{result.entityId}
				</div>
				<div className="font-mono text-xs text-[#a1a1aa] whitespace-nowrap overflow-hidden text-ellipsis">
					{result.entityId.slice(0, 16)}…
				</div>
			</div>
			{/* Property column */}
			<div>
				<div className="font-mono text-xs text-[#3f3f46]">{result.propertyId.slice(0, 12)}…</div>
			</div>
			{/* Value column with highlighting */}
			<div className="text-sm text-[#3f3f46] leading-snug">
				<HighlightedText text={valueText} query={query} />
			</div>
			{/* Open button */}
			<div className="text-right">
				<button
					type="button"
					onClick={() => onOpen(result.entityId)}
					className="border border-border bg-card px-2 py-[3px] rounded-[5px] text-xs cursor-pointer text-[#3f3f46]"
				>
					Open
				</button>
			</div>
		</div>
	)
}
