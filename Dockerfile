# ===================================================================
# GHGConnect Backend Dockerfile
# ===================================================================
# Multi-stage build for optimized production images
# ===================================================================

# ============================================
# Stage 1: Base - Install dependencies
# ============================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 2: Development - For local development
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci && \
    npm cache clean --force

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start development server with hot-reload
CMD ["npm", "run", "dev"]

# ============================================
# Stage 3: Builder - Build production artifacts
# ============================================
FROM base AS builder

WORKDIR /app

# Copy source code
COPY . .

# Install dev dependencies temporarily for building
RUN npm ci

# Build the application
RUN npm run build

# ============================================
# Stage 4: Production - Optimized runtime
# ============================================
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    postgresql-client \
    dumb-init

# Copy production dependencies from base
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["npm", "start"]


