# syntax=docker/dockerfile:1

# ---- deps: install all dependencies; native addons compiled here ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# better-sqlite3 is a native addon. A prebuilt binary usually matches this
# platform/Node ABI, but ship a toolchain so a source build can't break CI.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: produce the standalone server bundle ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* is inlined into the client bundle and prerendered pages at build
# time, so it must be present here — the runtime .env (compose env_file) is too
# late. It is a public flag, not a secret, so baking it into the image is fine.
ARG NEXT_PUBLIC_LOCAL_ONLY
ENV NEXT_PUBLIC_LOCAL_ONLY=$NEXT_PUBLIC_LOCAL_ONLY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal image that serves the standalone output ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Standalone output bundles only the traced node_modules plus a minimal
# server.js. public/ and .next/static are not copied by it, so add them here.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Migration SQL is read from disk at runtime (instrumentation applies pending
# Neon migrations on boot); the standalone trace does not include these files.
COPY --from=builder --chown=node:node /app/lib/db/migrations ./lib/db/migrations
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
