# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy full workspace for build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY libs ./libs

# Install all dependencies (dev included, needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client (Prisma 7 requires --config flag)
RUN npx prisma generate --schema=libs/database/prisma/schema.prisma --config=libs/database/prisma/prisma.config.ts

# Build the API (generates dist/apps/api with package.json + lockfile)
RUN npx nx build api --skip-nx-cache

# ==========================================
# Stage 2: Production dependencies
# ==========================================
FROM node:22-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /build

# Use the generated package.json with only production dependencies
COPY --from=builder /app/dist/apps/api/package.json ./package.json
COPY --from=builder /app/dist/apps/api/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy Prisma schema and config before installing
COPY --from=builder /app/libs/database/prisma ./prisma

# Install with shamefully-hoist to avoid symlink issues (creates flat node_modules like npm)
RUN pnpm install --frozen-lockfile --prod --shamefully-hoist

# Generate Prisma client
RUN pnpx prisma@7.2.0 generate --schema=./prisma/schema.prisma --config=./prisma/prisma.config.ts

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
COPY --from=builder /app/dist/apps/api/main.js ./main.js
COPY --from=builder /app/dist/apps/api/assets ./assets
COPY --from=prod-deps /build/node_modules ./node_modules
COPY --from=prod-deps /build/package.json ./package.json
COPY --from=prod-deps /build/prisma ./prisma

USER nestjs

EXPOSE 3333

CMD ["node", "main.js"]
