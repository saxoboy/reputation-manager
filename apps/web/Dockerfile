# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy full workspace for build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY libs ./libs

# Install all dependencies (dev included, needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client (needed for server-side code)
RUN npx prisma generate --schema=libs/database/prisma/schema.prisma

# Build the Next.js app (standalone output)
RUN npx nx build web --skip-nx-cache

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (includes minimal node_modules)
COPY --from=builder /app/dist/apps/web/.next/standalone ./
COPY --from=builder /app/dist/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
