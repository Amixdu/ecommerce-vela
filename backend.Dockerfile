# syntax=docker/dockerfile:1

# ── prune ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

# ── build & prune ─────────────────────────────────────────────────────────────
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

# SLim the image
RUN npm prune --omit=dev

# ── production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# FIX THE SYMLINK ERROR: Copy the entire built and pruned workspace
# This ensures packages/types and apps/backend both exist, keeping symlinks alive.
COPY --from=builder /app .

# Set the working directory directly inside the backend app
WORKDIR /app/apps/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

# Start the application
CMD ["npm", "run", "start"]