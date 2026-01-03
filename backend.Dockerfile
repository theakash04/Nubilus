FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci
COPY backend .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy migrations folder manually since tsc doesn't include .sql files
COPY backend/src/db/migrations ./dist/db/migrations

# Create non-root user for security
RUN addgroup -S nubilus && adduser -S nubilus -G nubilus
USER nubilus

# Expose the port
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "node dist/db/migrations/migration.js && node dist/db/seed.js && node dist/index.js"]
