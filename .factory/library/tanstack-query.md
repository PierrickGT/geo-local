# TanStack Query Patterns

Patterns for using TanStack Query v5 in the explorer package.

---

## Query Client Setup

Located in `packages/explorer/src/lib/query-client.ts`:

```typescript
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000, // 30 seconds
			retry: 1,
		},
	},
})
```

The QueryClientProvider wraps the app in `main.tsx`.

## Query Key Factory Pattern

Query keys are defined using factory objects for consistent cache management:

```typescript
// packages/explorer/src/hooks/use-entities.ts
const entityKeys = {
	all: ['entities'] as const,
	list: (type?: string, limit?: number, offset?: number) =>
		[...entityKeys.all, 'list', { type, limit, offset }] as const,
	detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
	relations: (id: string, direction?: string, relType?: string) =>
		[...entityKeys.all, 'relations', id, { direction, relType }] as const,
}
```

Similar factories exist for `searchKeys` and `editKeys`.

## Hook Return Types

Query hooks return semantic data properties rather than generic `data`:

```typescript
// useEntities returns:
{ entities, total, limit, offset, isLoading, isError, error, refetch }

// useSearch returns:
{ results, isLoading, isError, error, refetch }

// useEdits returns:
{ edits, isLoading, isError, error, refetch }
```

This provides better DX with named properties instead of generic `data`.

## Conditional Fetching

Hooks use the `enabled` option to prevent unnecessary requests:

```typescript
useQuery({
	queryKey: searchKeys.query(q),
	queryFn: () => searchEntities(q, limit),
	enabled: !!q && q.trim().length > 0, // Only fetch if query is non-empty
})
```
