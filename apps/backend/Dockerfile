# ============================================
# Multi-stage Dockerfile for Backend
# ============================================
# Usage:
#   target: dev   → development with hot-reload
#   target: prod  → optimized production image
# ============================================

# === Stage: base ===
FROM node:22-slim AS base
WORKDIR /app

# System dependencies (OpenSSL for Prisma, fonts for PDF)
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# === Stage: dev ===
FROM base AS dev
RUN npm install
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma generate && npm run dev"]

# === Stage: build ===
FROM base AS build
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate
RUN npx tsc --skipLibCheck --noEmitOnError false || true

# === Stage: prod ===
FROM node:22-slim AS prod
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/fonts ./fonts
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./

RUN npx prisma generate

EXPOSE 3001
CMD ["npx", "tsx", "src/index.ts"]
