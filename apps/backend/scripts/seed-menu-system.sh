#!/bin/bash

# Seed Menu System Script
# Seeds templates and packages for the menu system
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

# Seed 1: Menu Templates
echo "🔹 Step 1/2: Seeding Menu Templates (30)..."
echo ""
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-menu-templates.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Template seed failed. Aborting."
  exit 1
fi

echo ""
echo "🔹 Step 2/2: Seeding Menu Packages (20+)..."
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
