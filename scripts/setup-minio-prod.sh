#!/bin/bash
# ============================================
# MinIO Production Setup — Service Account
# ============================================
# Run ONCE after first MinIO start to create
# a dedicated backend service account.
#
# Usage:
#   chmod +x scripts/setup-minio-prod.sh
#   ./scripts/setup-minio-prod.sh
#
# Requires: .env.prod with MINIO_ROOT_USER,
#   MINIO_ROOT_PASSWORD set.
# ============================================

set -euo pipefail

# Load .env.prod
if [ ! -f .env.prod ]; then
  echo "❌ .env.prod not found. Copy .env.prod.example and fill in values."
  exit 1
fi
source .env.prod

# Defaults
MINIO_PORT=${MINIO_PORT:-9000}
COMPOSE_PROD="docker compose -p rezerwacje-prod -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod"

echo ""
echo "═══ MinIO Production Setup ═══"
echo ""

# Generate service account credentials if not set
if [ -z "${MINIO_ACCESS_KEY:-}" ] || [ "$MINIO_ACCESS_KEY" = "CHANGE_ME" ]; then
  NEW_ACCESS_KEY="svc-rezerwacje-$(openssl rand -hex 8)"
  NEW_SECRET_KEY="$(openssl rand -base64 32)"

  echo "🔑 Generated service account credentials:"
  echo "   MINIO_ACCESS_KEY=$NEW_ACCESS_KEY"
  echo "   MINIO_SECRET_KEY=$NEW_SECRET_KEY"
  echo ""
else
  NEW_ACCESS_KEY="$MINIO_ACCESS_KEY"
  NEW_SECRET_KEY="$MINIO_SECRET_KEY"
  echo "ℹ️  Using existing MINIO_ACCESS_KEY from .env.prod"
fi

# Create service account via mc in minio container
echo "📦 Creating service account in MinIO..."
$COMPOSE_PROD exec minio sh -c "
  mc alias set local http://localhost:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD > /dev/null 2>&1

  # Create user
  mc admin user add local '$NEW_ACCESS_KEY' '$NEW_SECRET_KEY' 2>/dev/null || true

  # Attach readwrite policy
  mc admin policy attach local readwrite --user '$NEW_ACCESS_KEY' 2>/dev/null || true

  echo 'Done.'
"

echo ""
echo "═══ RESULT ═══"
echo ""
echo "✅ Service account created with readwrite policy."
echo ""
echo "Add to .env.prod (if not already there):"
echo "  MINIO_ACCESS_KEY=$NEW_ACCESS_KEY"
echo "  MINIO_SECRET_KEY=$NEW_SECRET_KEY"
echo ""
echo "⚠️  Backend uses these credentials. Root credentials are for admin only."
echo ""
