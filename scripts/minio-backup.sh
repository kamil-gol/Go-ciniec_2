#!/bin/bash
# ============================================
# MinIO Backup Script (H3)
# ============================================
# Backs up MinIO data by copying from the Docker volume.
# Works with both dev (named volume) and prod (bind mount /data/minio).
#
# Usage:
#   ./scripts/minio-backup.sh
#   BACKUP_DIR=/custom/path ./scripts/minio-backup.sh
#
# Cron (nightly at 2:00 AM):
#   0 2 * * * cd /home/kamil/rezerwacje && ./scripts/minio-backup.sh >> /var/log/minio-backup.log 2>&1
#
# Retention: keeps last 7 daily backups.
# ============================================

set -euo pipefail

BACKUP_BASE="${BACKUP_DIR:-/data/backups/minio}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_TARGET="${BACKUP_BASE}/${DATE}"
LATEST_LINK="${BACKUP_BASE}/latest"

# Find running minio container
CONTAINER=$(docker ps --filter "name=rezerwacje-minio" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "[$(date -Iseconds)] ERROR: No running MinIO container found."
  exit 1
fi

ENV="unknown"
if echo "$CONTAINER" | grep -q "dev"; then ENV="dev"; fi
if echo "$CONTAINER" | grep -q "prod"; then ENV="prod"; fi

echo ""
echo "[$(date -Iseconds)] === MinIO Backup ==="
echo "  Container:  ${CONTAINER}"
echo "  Environment: ${ENV}"
echo "  Target:      ${BACKUP_TARGET}"
echo "  Retention:   ${RETENTION_DAYS} days"
echo ""

# Create backup directory
mkdir -p "${BACKUP_TARGET}"

# Copy all data from container /data to backup
echo "[$(date -Iseconds)] Copying MinIO data from container..."
docker cp "${CONTAINER}:/data/." "${BACKUP_TARGET}/"

# Count files and size
FILES=$(find "${BACKUP_TARGET}" -type f 2>/dev/null | wc -l)
SIZE=$(du -sh "${BACKUP_TARGET}" 2>/dev/null | cut -f1)

echo "[$(date -Iseconds)] Copied: ${FILES} files, ${SIZE}"

# Update latest symlink
rm -f "${LATEST_LINK}"
ln -sf "${BACKUP_TARGET}" "${LATEST_LINK}"

# Cleanup old backups
echo ""
echo "[$(date -Iseconds)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_BASE}" -maxdepth 1 -mindepth 1 -type d -not -name "latest" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
REMAINING=$(find "${BACKUP_BASE}" -maxdepth 1 -mindepth 1 -type d -not -name "latest" | wc -l)

echo ""
echo "[$(date -Iseconds)] === Backup Complete ==="
echo "  Files: ${FILES}"
echo "  Size:  ${SIZE}"
echo "  Path:  ${BACKUP_TARGET}"
echo "  Retained: ${REMAINING} backups"
echo ""
