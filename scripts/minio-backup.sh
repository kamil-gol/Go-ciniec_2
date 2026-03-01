#!/bin/bash
# ============================================
# MinIO Backup Script (H3)
# ============================================
# Backs up MinIO data by copying from the Docker volume mountpoint.
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

# Find running minio container and its volume
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
echo "  Container:   ${CONTAINER}"
echo "  Environment: ${ENV}"
echo "  Target:      ${BACKUP_TARGET}"
echo "  Retention:   ${RETENTION_DAYS} days"
echo ""

# Determine source path
if [ "$ENV" = "prod" ]; then
  # Prod uses bind mount /data/minio
  SOURCE_PATH="/data/minio"
else
  # Dev uses named volume — find mountpoint
  VOLUME_NAME=$(docker inspect "$CONTAINER" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')

  if [ -z "$VOLUME_NAME" ]; then
    # Fallback: try bind mount path
    SOURCE_PATH=$(docker inspect "$CONTAINER" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}')
  else
    SOURCE_PATH=$(docker volume inspect "$VOLUME_NAME" --format '{{.Mountpoint}}')
  fi
fi

if [ -z "$SOURCE_PATH" ] || [ ! -d "$SOURCE_PATH" ]; then
  echo "[$(date -Iseconds)] ERROR: Cannot find MinIO data directory."
  echo "  Tried: ${SOURCE_PATH:-<empty>}"
  exit 1
fi

echo "[$(date -Iseconds)] Source: ${SOURCE_PATH}"

# Create backup directory
mkdir -p "${BACKUP_TARGET}"

# Copy data
echo "[$(date -Iseconds)] Copying MinIO data..."
cp -a "${SOURCE_PATH}/." "${BACKUP_TARGET}/"

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
