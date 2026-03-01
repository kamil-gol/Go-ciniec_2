#!/bin/bash
# ============================================
# MinIO Backup Script (H3)
# ============================================
# Backs up MinIO data using stdout pipe from a helper container.
# This bypasses snap Docker's bind-mount isolation.
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
BACKUP_FILE="${BACKUP_BASE}/${DATE}.tar.gz"
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
echo "  Container:   ${CONTAINER}"
echo "  Environment: ${ENV}"
echo "  Target:      ${BACKUP_FILE}"
echo "  Retention:   ${RETENTION_DAYS} days"
echo ""

# Create backup directory
mkdir -p "${BACKUP_BASE}"

# Backup using stdout pipe — bypasses snap Docker sandbox
# --volumes-from mounts the minio data volume inside the helper container
# tar writes to stdout (-), shell redirects to host filesystem
echo "[$(date -Iseconds)] Creating backup via stdout pipe..."
docker run --rm \
  --volumes-from "${CONTAINER}" \
  alpine \
  tar czf - -C /data . > "${BACKUP_FILE}"

# Verify backup is not empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[$(date -Iseconds)] ERROR: Backup file is empty!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

FILES=$(tar tzf "${BACKUP_FILE}" 2>/dev/null | wc -l)
SIZE=$(du -sh "${BACKUP_FILE}" 2>/dev/null | cut -f1)

if [ "${FILES}" -eq 0 ]; then
  echo "[$(date -Iseconds)] ERROR: Backup archive contains 0 files!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "[$(date -Iseconds)] Backup created: ${SIZE}, ${FILES} files"

# Update latest symlink
rm -f "${LATEST_LINK}"
ln -sf "${BACKUP_FILE}" "${LATEST_LINK}"

# Cleanup old tar.gz backups
echo ""
echo "[$(date -Iseconds)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_BASE}" -maxdepth 1 -name '*.tar.gz' -type f -mtime +${RETENTION_DAYS} -exec rm -f {} \; 2>/dev/null || true

# Also remove old directory-based backups from previous method
find "${BACKUP_BASE}" -maxdepth 1 -mindepth 1 -type d -not -name "latest" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

REMAINING=$(find "${BACKUP_BASE}" -maxdepth 1 \( -name '*.tar.gz' -type f \) -o \( -type d -not -name "latest" -mindepth 1 \) 2>/dev/null | wc -l)

echo ""
echo "[$(date -Iseconds)] === Backup Complete ==="
echo "  File:     ${BACKUP_FILE}"
echo "  Size:     ${SIZE}"
echo "  Files:    ${FILES}"
echo "  Retained: ${REMAINING} backup(s)"
echo ""
