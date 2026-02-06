# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy full workspace for build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY libs ./libs

# Install all dependencies (dev included, needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN npx prisma generate --schema=libs/database/prisma/schema.prisma

# Build the Worker (generates dist/apps/worker with package.json + lockfile)
RUN npx nx build worker --skip-nx-cache

# ==========================================
# Stage 2: Production dependencies
# ==========================================
FROM node:22-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Use the generated package.json with only production dependencies
COPY --from=builder /app/dist/apps/worker/package.json ./package.json
COPY --from=builder /app/dist/apps/worker/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --prod

# Copy Prisma client from builder (generated in node_modules)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# ==========================================
# Stage 3: Production
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built app and production dependencies
COPY --from=builder /app/dist/apps/worker/main.js ./main.js
COPY --from=builder /app/dist/apps/worker/assets ./assets
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy Prisma schema (needed for migrations in production)
COPY --from=builder /app/libs/database/prisma ./prisma

USER nestjs

CMD ["node", "main.js"]
