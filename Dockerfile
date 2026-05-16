# =============================================================================
# THE ARCHITECT'S DESCENT — Docker container
# Stage 1: build the Vite/TypeScript bundle inside an isolated Node environment.
# Stage 2: serve the static output with nginx (no Node runtime in production).
# =============================================================================

# ── BUILD STAGE ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching — only re-runs if package files change)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY tsconfig.json index.html ./
COPY src/ ./src/
RUN npm run build

# ── SERVE STAGE ───────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS server

# Remove default nginx page and copy our built assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config: SPA-friendly (all routes → index.html), gzip enabled
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

LABEL org.opencontainers.image.title="The Architect's Descent"
LABEL org.opencontainers.image.description="Satirical 8-bit enterprise platformer"
LABEL org.opencontainers.image.version="0.0.1-MVP"

CMD ["nginx", "-g", "daemon off;"]
