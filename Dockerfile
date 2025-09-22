# Use the official Node.js runtime as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Accept build arguments
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ERP_ENV
ARG ERP_BASE_URL
ARG ERP_DEV_BASE_URL

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ERP_ENV=$NEXT_PUBLIC_ERP_ENV
ENV ERP_BASE_URL=$ERP_BASE_URL
ENV ERP_DEV_BASE_URL=$ERP_DEV_BASE_URL

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install ALL dependencies including devDependencies for build
RUN npm ci --include=dev

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from previous stage
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/public ./public

# Set user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
