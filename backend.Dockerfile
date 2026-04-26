# syntax=docker/dockerfile:1

# ── prune ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Bring in the root workspace definitions and lockfile (404 err fix)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install ALL dependencies (so TypeScript can compile)
RUN npm install --ignore-scripts

# Copy the actual source code and build it
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=backend...

# ── production image ──────────────────────────────────────────────────────────
# .medusa/server/ is the self-contained bundle medusa build emits:
# compiled src/, medusa-config.js, and package.json — no workspace, no symlinks.
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/backend/.medusa/server ./

# Install prod deps. @ecommerce/* are devDeps so --omit=dev skips them
# (no registry lookup for workspace-only packages).
RUN npm install --omit=dev --ignore-scripts

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

# Start the application
CMD ["node", "node_modules/@medusajs/cli/cli.js", "start"]
