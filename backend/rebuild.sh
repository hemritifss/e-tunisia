#!/usr/bin/env sh
# Quick rebuild helper for the production-style Docker image (Dockerfile).
#
# When you edit backend source and you're running the prod image (not the
# dev override), the container won't pick up changes until:
#   1. you rebuild dist on the host
#   2. you rebuild the container image
#   3. you recreate the container
#
# Run this from the backend/ directory.

set -e

echo "→ Compiling TypeScript on host (nest build)…"
npm run build

echo "→ Rebuilding api image…"
docker compose build api

echo "→ Restarting api container…"
docker compose up -d api

echo
echo "✓ Done. Tail logs with: docker compose logs -f api"
echo "  Verify routes:        curl -s http://localhost:3000/api/v1/billing/me -H 'Authorization: Bearer <jwt>' | jq"
