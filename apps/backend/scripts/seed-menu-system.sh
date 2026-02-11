#!/bin/bash

# Seed Menu System Script
# Seeds event types, templates and packages for the menu system
# Run: bash scripts/seed-menu-system.sh

echo "🎉 Starting Menu System Seed..."
echo ""

# Navigate to backend directory if not already there
cd "$(dirname "$0")/.." || exit

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found. Installing dependencies..."
  npm install
fi

# Seed 0: Event Types
echo "🔹 Step 1/3: Seeding Event Types (7)..."
echo ""
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-event-types.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Event types seed failed. Aborting."
  exit 1
fi

# Seed 1: Menu Templates
echo ""
echo "🔹 Step 2/3: Seeding Menu Templates (30)..."
echo ""
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-menu-templates.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Template seed failed. Aborting."
  exit 1
fi

echo ""
echo "🔹 Step 3/3: Seeding Menu Packages (20+)..."
echo ""
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-menu-packages.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Package seed failed."
  exit 1
fi

echo ""
echo "✅ Menu System Seed Complete!"
echo ""
echo "🔗 View results:"
echo "   - Szablony: http://62.171.189.172:3000/dashboard/menu/templates"
echo "   - Pakiety:  http://62.171.189.172:3000/dashboard/menu/packages"
echo ""
