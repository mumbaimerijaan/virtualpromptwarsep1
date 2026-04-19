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

# Only copy production-essential artifacts with recursive ownership fixes mapping @[skills/serverless-gcp-deployment]
COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /usr/src/app/public ./public
COPY --from=builder --chown=appuser:appgroup /usr/src/app/lib ./lib
COPY --from=builder --chown=appuser:appgroup /usr/src/app/services ./services
COPY --from=builder --chown=appuser:appgroup /usr/src/app/middleware ./middleware
COPY --from=builder --chown=appuser:appgroup /usr/src/app/routes ./routes
COPY --from=builder --chown=appuser:appgroup /usr/src/app/server.js ./server.js
COPY --from=builder --chown=appuser:appgroup /usr/src/app/package.json ./package.json

USER appuser

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Deep Healthcheck mapping @[skills/resilient-data-patterns]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/config || exit 1

CMD ["node", "server.js"]
