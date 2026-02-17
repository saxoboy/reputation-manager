#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma --config=./prisma/prisma.config.ts

echo "✅ Migrations completed"
echo "🚀 Starting API server..."
exec node main.js
