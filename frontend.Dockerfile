# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend .

# Build args
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_DOCS_URL=$VITE_DOCS_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS runner

# Copy built artifacts from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx config for React Router fallback
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
