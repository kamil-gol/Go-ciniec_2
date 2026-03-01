#!/bin/bash
# ============================================
# MinIO Backup Script (H3)
# ============================================
# Backs up all MinIO buckets to a local directory.
# Uses `mc mirror` for incremental sync.
#
# Usage:
#   ./scripts/minio-backup.sh              # manual run
#   BACKUP_DIR=/custom/path ./scripts/...  # custom target
#
# Cron (nightly at 2:00 AM):
#   0 2 * * * cd /home/kamil/rezerwacje && ./scripts/minio-backup.sh >> /var/log/minio-backup.log 2>&1
#
# Retention: keeps last 7 daily backups (configurable).
# ============================================

set -euo pipefail

# Config
BACKUP_BASE="${BACKUP_DIR:-/data/backups/minio}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_TARGET="${BACKUP_BASE}/${DATE}"
LATEST_LINK="${BACKUP_BASE}/latest"

# Detect compose setup
if [ -f .env.prod ] && docker compose -p rezerwacje-prod ps --status running 2>/dev/null | grep -q minio; then
  COMPOSE="docker compose -p rezerwacje-prod -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod"
  ENV="prod"
elif [ -f .env.dev ] && docker compose -p rezerwacje-dev ps --status running 2>/dev/null | grep -q minio; then
  COMPOSE="docker compose -p rezerwacje-dev -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev"
  ENV="dev"
else
  echo "[$(date -Iseconds)] ERROR: No running MinIO container found."
  exit 1
fi

echo ""
echo "[$(date -Iseconds)] === MinIO Backup ==="
echo "  Environment: ${ENV}"
echo "  Target:      ${BACKUP_TARGET}"
echo "  Retention:   ${RETENTION_DAYS} days"
echo ""

# Create backup directory
mkdir -p "${BACKUP_TARGET}"

# Setup mc alias inside minio container and mirror all buckets
BUCKETS=$($COMPOSE exec -T minio sh -c '
  mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD >/dev/null 2>&1
  mc ls local/ --json 2>/dev/null | grep -o "\"key\":\"[^"]*\"" | cut -d"\"" -f4 | tr -d "/"
')

if [ -z "$BUCKETS" ]; then
  echo "[$(date -Iseconds)] WARNING: No buckets found. Nothing to backup."
  exit 0
fi

TOTAL_FILES=0
TOTAL_SIZE=0

for BUCKET in $BUCKETS; do
  echo "[$(date -Iseconds)] Backing up bucket: ${BUCKET}"
  mkdir -p "${BACKUP_TARGET}/${BUCKET}"

  # Mirror bucket to local directory
  $COMPOSE exec -T minio sh -c "
    mc alias set local http://localhost:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD >/dev/null 2>&1
    mc mirror --quiet local/${BUCKET} /tmp/backup-${BUCKET}/ 2>/dev/null
    mc ls local/${BUCKET}/ --recursive --json 2>/dev/null | wc -l
  " > /tmp/minio-count-${BUCKET} 2>/dev/null || true

  # Copy from container to host
  CONTAINER_ID=$($COMPOSE ps -q minio)
  docker cp "${CONTAINER_ID}:/tmp/backup-${BUCKET}/" "${BACKUP_TARGET}/${BUCKET}/" 2>/dev/null || true

  # Cleanup temp in container
  $COMPOSE exec -T minio rm -rf "/tmp/backup-${BUCKET}" 2>/dev/null || true

  FILES=$(find "${BACKUP_TARGET}/${BUCKET}" -type f 2>/dev/null | wc -l)
  SIZE=$(du -sh "${BACKUP_TARGET}/${BUCKET}" 2>/dev/null | cut -f1)
  echo "  -> ${FILES} files, ${SIZE}"
  TOTAL_FILES=$((TOTAL_FILES + FILES))
done

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
echo "  Files backed up: ${TOTAL_FILES}"
echo "  Location:        ${BACKUP_TARGET}"
echo "  Symlink:         ${LATEST_LINK}"
echo "  Retained:        ${REMAINING} backups"
echo ""
