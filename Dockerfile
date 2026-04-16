# BUILDER
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# RUNTIME
FROM node:18-alpine
WORKDIR /usr/src/app
# Create standard secure execution
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
