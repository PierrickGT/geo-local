# Knowledge Graph Explorer

A React + Vite SPA for browsing the Geo Knowledge Graph. The explorer talks HTTP to the read-only API and provides visualization, search, and navigation capabilities.

## Quick Start

```bash
# Start dependencies
docker compose up -d
pnpm dev:api

# Start explorer
pnpm dev:explorer

# Open http://localhost:3003
```

## Features

- **Entity List**: Paginated list with type filter, URL sync
- **Entity Detail**: Triples and relations with outgoing/incoming tabs
- **Search**: Full-text search with 300ms debounce, URL sync
- **Edits**: Edit history with status filter and badges
- **Graph**: Force-directed visualization with expand, navigate, pin

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/entities` |
| `/entities` | Entity list with type filter and pagination |
| `/entities/:id` | Entity detail with triples and relations |
| `/search` | Full-text search |
| `/edits` | Edit history |
| `/graph` | Force-directed graph visualization |
| `/graph?focus=:id` | Graph centered on specific entity |

## Architecture

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (CSS-native config)
- **Routing**: React Router v7
- **State**: TanStack Query v5
- **Graph**: d3-force + ReactFlow

## Development

```bash
# Type check
pnpm --filter @geo-runtime/explorer run typecheck

# Lint
pnpm biome check packages/explorer/src

# Test
pnpm --filter @geo-runtime/explorer run test

# Build
pnpm --filter @geo-runtime/explorer run build
```

## API Proxy

In development, `/api` requests proxy to `localhost:3002`. Production deployments should use a reverse proxy.
