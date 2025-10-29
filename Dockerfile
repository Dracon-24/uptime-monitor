# ---------- Multi-stage Node build ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ---------- Production stage ----------
FROM node:18-alpine AS production

WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

# Serve built app
CMD ["serve", "-s", "dist", "-l", "3000"]
