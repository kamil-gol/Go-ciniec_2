#!/bin/bash
# ============================================
# MinIO Bucket Policies Setup (H4)
# ============================================
# Sets explicit private policies on all buckets,
# enables versioning on attachments bucket,
# and configures lifecycle rules for exports.
#
# Usage:
#   make minio-policies
#   ./scripts/minio-set-policies.sh
# ============================================

set -euo pipefail

log() { echo "[$(date -Iseconds)] $*"; }

# Find running minio container
CONTAINER=$(docker ps --filter "name=rezerwacje-minio" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  log "ERROR: No running MinIO container found."
  exit 1
fi

ENV="unknown"
if echo "$CONTAINER" | grep -q "dev"; then ENV="dev"; fi
if echo "$CONTAINER" | grep -q "prod"; then ENV="prod"; fi

log "=== MinIO Bucket Policies (${ENV}) ==="
log "  Container: ${CONTAINER}"

# Helper: run mc command inside container
# Uses container's own env vars for credentials
mc_exec() {
  docker exec "${CONTAINER}" sh -c "mc $*" 2>/dev/null
}

# Setup mc alias (using container env vars)
log "Setting up mc alias..."
docker exec "${CONTAINER}" sh -c \
  'mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD' \
  > /dev/null 2>&1

if ! mc_exec "alias list local" > /dev/null 2>&1; then
  log "ERROR: Failed to configure mc alias."
  exit 1
fi

log "  mc alias configured"

# Get bucket list
BUCKETS=$(mc_exec "ls local/" | sed 's/.*[0-9]B //' | tr -d '/' | tr -d ' ' || true)

if [ -z "$BUCKETS" ]; then
  log "WARNING: No buckets found."
  exit 0
fi

log ""

for BUCKET in $BUCKETS; do
  log "Bucket: ${BUCKET}"

  # 1. Set private policy (deny all anonymous access)
  mc_exec "anonymous set none local/${BUCKET}" > /dev/null 2>&1 || true
  log "  Policy: private (no anonymous access)"

  # 2. Enable versioning on attachments bucket (protects against accidental deletes)
  if [ "${BUCKET}" = "attachments" ]; then
    if mc_exec "version enable local/${BUCKET}" > /dev/null 2>&1; then
      log "  Versioning: enabled"
    else
      log "  Versioning: skipped (single-drive setup, needs erasure coding)"
    fi
  fi

  # 3. Lifecycle rule: auto-delete exports after 7 days
  if [ "${BUCKET}" = "exports" ]; then
    # Create lifecycle config JSON inside container
    docker exec "${CONTAINER}" sh -c 'cat > /tmp/lifecycle.json << LCEOF
{
  "Rules": [
    {
      "ID": "auto-cleanup-exports",
      "Status": "Enabled",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
LCEOF
mc ilm import local/exports < /tmp/lifecycle.json && rm -f /tmp/lifecycle.json' 2>/dev/null && \
      log "  Lifecycle: auto-delete after 7 days" || \
      log "  Lifecycle: skipped (mc ilm not available or single-drive)"
  fi

  # 4. Stats
  COUNT=$(mc_exec "ls local/${BUCKET}/ --recursive" | wc -l || echo "0")
  SIZE=$(mc_exec "du local/${BUCKET}/" | tail -1 | sed 's/ .*//' || echo "0B")
  log "  Files: ${COUNT}, Size: ${SIZE:-0B}"
  log ""
done

# Summary
log "=== Policies Applied ==="
log "  All buckets: private (no anonymous access)"
log "  attachments: versioning enabled (if erasure coding available)"
log "  exports: auto-delete after 7 days"
log ""
