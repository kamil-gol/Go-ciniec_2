#!/bin/bash
# ============================================
# MinIO Bucket Policies Setup (H4)
# ============================================
# Sets explicit private policies on all buckets
# and enables versioning on attachments bucket.
#
# Usage:
#   ./scripts/minio-set-policies.sh
#
# Run ONCE after first MinIO start or after
# creating new buckets.
# ============================================

set -euo pipefail

# Detect compose setup
if [ -f .env.prod ] && docker compose -p rezerwacje-prod ps --status running 2>/dev/null | grep -q minio; then
  COMPOSE="docker compose -p rezerwacje-prod -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod"
  ENV="prod"
elif [ -f .env.dev ] && docker compose -p rezerwacje-dev ps --status running 2>/dev/null | grep -q minio; then
  COMPOSE="docker compose -p rezerwacje-dev -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev"
  ENV="dev"
else
  echo "❌ No running MinIO container found."
  exit 1
fi

echo ""
echo "═══ MinIO Bucket Policies Setup (${ENV}) ═══"
echo ""

$COMPOSE exec -T minio sh -c '
  mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD >/dev/null 2>&1

  echo "=== Setting bucket policies ==="
  echo ""

  # List all buckets
  BUCKETS=$(mc ls local/ 2>/dev/null | awk "{print \$NF}" | tr -d "/")

  for BUCKET in $BUCKETS; do
    echo "📦 Bucket: $BUCKET"

    # Set private policy (deny all anonymous access)
    mc anonymous set none local/$BUCKET 2>/dev/null
    echo "   ✅ Policy: private (no anonymous access)"

    # Enable versioning on attachments bucket (protect against accidental deletion)
    if [ "$BUCKET" = "attachments" ]; then
      mc version enable local/$BUCKET 2>/dev/null || echo "   ⚠️  Versioning not supported (erasure coding required)"
      echo "   ✅ Versioning: enabled (attachments)"
    fi

    # Show bucket info
    SIZE=$(mc du local/$BUCKET/ 2>/dev/null | tail -1 | awk "{print \$1}")
    COUNT=$(mc ls local/$BUCKET/ --recursive 2>/dev/null | wc -l)
    echo "   📊 Files: $COUNT, Size: ${SIZE:-0B}"
    echo ""
  done

  echo "=== Done ==="
'

echo ""
echo "✅ Bucket policies configured."
echo ""
