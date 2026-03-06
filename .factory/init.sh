#!/bin/bash
set -e

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  pnpm install
fi

# Ensure .env exists with defaults
if [ ! -f ".env" ]; then
  echo "DATABASE_URL=postgres://postgres:password@localhost:5433/geo" > .env
  echo "API_PORT=3002" >> .env
  echo "INGEST_PORT=3001" >> .env
fi

echo "Explorer environment ready"
