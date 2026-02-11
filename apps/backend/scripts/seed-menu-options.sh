#!/bin/bash

# Seed Menu Options Script
# Run: bash scripts/seed-menu-options.sh

echo "🌱 Starting Menu Options Seed..."
echo ""

# Navigate to backend directory if not already there
cd "$(dirname "$0")/.." || exit

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found. Installing dependencies..."
  npm install
fi

# Run the seed script with ts-node
echo "🚀 Running seed script..."
echo ""

npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-menu-options.ts

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Seed completed successfully!"
  echo "🔗 View options at: http://62.171.189.172:3000/dashboard/menu/options"
else
  echo ""
  echo "❌ Seed failed. Check the error messages above."
  exit 1
fi
