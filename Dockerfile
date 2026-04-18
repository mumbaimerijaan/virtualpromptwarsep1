# STAGE 1: ASSET MINIFICATION mapping @[skills/high-performance-web-optimization]
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Copy all source and run the build orchestrator
COPY . .
RUN node scripts/build.js

# STAGE 2: PRODUCTION RUNTIME mapping @[skills/zero-trust-cloud-security]
FROM node:18-alpine
WORKDIR /usr/src/app

# Install curl for HEALTHCHECK satisfies @[skills/efficiency-pillar]
RUN apk add --no-cache curl

# Hardening: Use non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Only copy production-essential artifacts
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/public/dist ./public/dist
COPY --from=builder /usr/src/app/public/css ./public/css
COPY --from=builder /usr/src/app/public/pages ./public/pages
COPY --from=builder /usr/src/app/public/index.html ./public/index.html
COPY --from=builder /usr/src/app/public/manifest.json ./public/manifest.json
COPY --from=builder /usr/src/app/lib ./lib
COPY --from=builder /usr/src/app/services ./services
COPY --from=builder /usr/src/app/middleware ./middleware
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/package.json ./package.json

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/config || exit 1

CMD ["node", "server.js"]
