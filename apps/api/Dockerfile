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

# Generate Prisma client
RUN npx prisma generate --schema=libs/database/prisma/schema.prisma

# Build the API (generates dist/apps/api with package.json + lockfile)
RUN npx nx build api --skip-nx-cache

# ==========================================
# Stage 2: Production dependencies
# ==========================================
FROM node:22-alpine AS prod-deps
WORKDIR /app

# Use the generated package.json with only production dependencies
COPY --from=builder /app/dist/apps/api/package.json ./package.json

# Copy Prisma schema (needed for generate)
COPY --from=builder /app/libs/database/prisma/schema.prisma ./prisma/schema.prisma

# Use npm (runs postinstall scripts needed by Prisma)
RUN npm install --omit=dev --legacy-peer-deps

# Generate Prisma client (version must match @prisma/client)
RUN npm install -g prisma@7.2.0 && prisma generate --schema=./prisma/schema.prisma

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
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy Prisma schema + migrations (needed for migrate deploy in production)
COPY --from=builder /app/libs/database/prisma ./prisma

# Install Prisma CLI for migrations (version must match @prisma/client)
RUN npm i -g prisma@7.2.0

USER nestjs

EXPOSE 3000

# Run Prisma migrations then start the app
# Note: prisma migrate deploy reads DATABASE_URL from environment automatically
CMD ["sh", "-c", "prisma migrate deploy --schema=./prisma/schema.prisma && node main.js"]
