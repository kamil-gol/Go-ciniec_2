#!/bin/bash
# ============================================
# MinIO Backup Infrastructure Setup
# ============================================
# Run once on the host to configure:
#   - logrotate for backup logs
#   - cron job with failure alerting
#   - directory permissions
#
# Usage: sudo ./scripts/setup-minio-backup.sh
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { echo "[$(date -Iseconds)] $*"; }

# Require root
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run as root (sudo $0)"
  exit 1
fi

log "=== MinIO Backup Setup ==="

# 1. Directory permissions
log "Setting up directories..."
mkdir -p /data/backups/minio
chmod 700 /data/backups/minio
chmod 700 "${SCRIPT_DIR}/minio-backup.sh"
log "  /data/backups/minio -> 700"
log "  minio-backup.sh -> 700"

# 2. Logrotate
log "Configuring logrotate..."
cat > /etc/logrotate.d/minio-backup << 'EOF'
/var/log/minio-backup.log /var/log/minio-backup-errors.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 640 root root
}
EOF
log "  /etc/logrotate.d/minio-backup created"

# 3. Cron job
CRON_LINE="0 2 * * * cd ${PROJECT_DIR} && ./scripts/minio-backup.sh >> /var/log/minio-backup.log 2>&1 || echo \"MINIO BACKUP FAILED \$(date)\" >> /var/log/minio-backup-errors.log"

# Remove old minio-backup cron entries, add new one
(crontab -l 2>/dev/null | grep -v 'minio-backup' || true; echo "$CRON_LINE") | crontab -
log "  Cron job installed (daily 2:00 AM)"

# 4. Cleanup stale svc-backup user if exists
if id svc-backup &>/dev/null; then
  userdel -r svc-backup 2>/dev/null || true
  log "  Removed stale svc-backup user"
fi

# 5. Verify
log ""
log "=== Setup Complete ==="
log "  Backup dir:  /data/backups/minio"
log "  Logrotate:   /etc/logrotate.d/minio-backup"
log "  Cron:        daily 2:00 AM as root (snap Docker requires root)"
log "  Logs:        /var/log/minio-backup.log"
log "  Errors:      /var/log/minio-backup-errors.log"
log ""
log "Verify cron:"
crontab -l | grep minio-backup
log ""
log "Test backup now:"
log "  make minio-backup"
