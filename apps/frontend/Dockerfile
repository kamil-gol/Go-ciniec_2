# ============================================
# Multi-stage Dockerfile for Frontend (Next.js)
# ============================================
# Usage:
#   target: dev   → development with hot-reload
#   target: prod  → optimized production image
# ============================================

# === Stage: base ===
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./

# === Stage: dev ===
FROM base AS dev
RUN npm ci --legacy-peer-deps
EXPOSE 3000
CMD ["npm", "run", "dev"]

# === Stage: build ===
FROM base AS build
RUN NODE_ENV=development npm ci --legacy-peer-deps
COPY . .

# Build args for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

RUN npm run build

# === Stage: prod ===
FROM node:22-alpine AS prod
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy only what's needed for production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
