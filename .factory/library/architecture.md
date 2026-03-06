# Architecture

Architectural decisions, patterns discovered, and design notes.

**What belongs here:** Decisions that affect how the system is built, patterns to follow, constraints.

---

## Monorepo Structure

```
packages/
├── api/        # Express API server (port 3002)
├── ingest/     # GRC-20 data ingestion (port 3001)
├── indexer/    # Background worker for processing edits
├── shared/     # Shared DB, types, utilities
└── explorer/   # React SPA (port 3003) - NEW
```

## Explorer Architecture

- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS v4 (CSS-native config, no tailwind.config.ts)
- **Routing:** React Router v7 with createBrowserRouter
- **State:** TanStack Query v5 for server state
- **Graph:** d3-force + ReactFlow for visualization

## Key Constraint: No Shared Package Dependency

The explorer must NOT depend on `@geo-runtime/shared`. All data comes via HTTP to the API. This keeps the frontend decoupled and deployable independently.

## API Proxy

In development, Vite proxies `/api` requests to `localhost:3002`:

```typescript
// vite.config.ts
server: {
  port: 3003,
  proxy: {
    '/api': 'http://localhost:3002'
  }
}
```

In production, use a reverse proxy (nginx, cloudflare, etc.).
