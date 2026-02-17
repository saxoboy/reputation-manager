#!/bin/sh
set -e

echo "🔄 Running database migrations..."
pnpx prisma@7.2.0 migrate deploy --schema=./prisma/schema.prisma --config=./prisma/prisma.config.ts

echo "✅ Migrations completed"
echo "🚀 Starting API server..."
exec node main.js
