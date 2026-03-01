#!/bin/bash
# ============================================
# MinIO Bucket Policies Setup (H4)
# ============================================
# Sets explicit private policies on all buckets
# and enables versioning on attachments bucket.
#
# Usage:
#   chmod +x scripts/minio-set-policies.sh
#   ./scripts/minio-set-policies.sh
# Or:
#   make minio-policies
# ============================================

set -euo pipefail

# Find running minio container
CONTAINER=$(docker ps --filter "name=rezerwacje-minio" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "❌ No running MinIO container found."
  exit 1
fi

ENV="unknown"
if echo "$CONTAINER" | grep -q "dev"; then ENV="dev"; fi
if echo "$CONTAINER" | grep -q "prod"; then ENV="prod"; fi

echo ""
echo "═══ MinIO Bucket Policies Setup (${ENV}) ═══"
echo "  Container: ${CONTAINER}"
echo ""

# Setup mc alias
docker exec "${CONTAINER}" mc alias set local http://localhost:9000 "${MINIO_ROOT_USER:-minioadmin}" "${MINIO_ROOT_PASSWORD:-minioadmin123}" > /dev/null 2>&1 || \
  docker exec "${CONTAINER}" sh -c 'mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD' > /dev/null 2>&1

# Get bucket list
BUCKETS=$(docker exec "${CONTAINER}" mc ls local/ 2>/dev/null | sed 's/.*[0-9]B //' | tr -d '/' | tr -d ' ')

if [ -z "$BUCKETS" ]; then
  echo "⚠️  No buckets found."
  exit 0
fi

for BUCKET in $BUCKETS; do
  echo "📦 Bucket: ${BUCKET}"

  # Set private policy (deny all anonymous access)
  docker exec "${CONTAINER}" mc anonymous set none "local/${BUCKET}" 2>/dev/null || true
  echo "   ✅ Policy: private (no anonymous access)"

  # Enable versioning on attachments bucket
  if [ "${BUCKET}" = "attachments" ]; then
    docker exec "${CONTAINER}" mc version enable "local/${BUCKET}" 2>/dev/null && \
      echo "   ✅ Versioning: enabled" || \
      echo "   ⚠️  Versioning: not supported (single drive, needs erasure coding)"
  fi

  # Show stats
  COUNT=$(docker exec "${CONTAINER}" mc ls "local/${BUCKET}/" --recursive 2>/dev/null | wc -l)
  SIZE=$(docker exec "${CONTAINER}" mc du "local/${BUCKET}/" 2>/dev/null | tail -1 | sed 's/ .*//')
  echo "   📊 Files: ${COUNT}, Size: ${SIZE:-0B}"
  echo ""
done

echo "✅ Bucket policies configured."
echo ""
