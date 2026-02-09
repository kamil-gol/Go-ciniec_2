#!/bin/bash

################################################################################
# Skrypt Backup dla Gościniec_2
# Tworzy backup bazy PostgreSQL + plików aplikacji
# Author: System Rezerwacji
# Version: 1.0.2
################################################################################

set -e  # Zatrzymaj na błędzie

# ===== KONFIGURACJA =====

# Katalogi
BACKUP_DIR="${BACKUP_DIR:-/home/kamil/backups/gosciniec}"
PROJECT_DIR="${PROJECT_DIR:-/home/kamil/rezerwacje}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Konfiguracja Docker
DOCKER_COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
DB_CONTAINER_NAME="${DB_CONTAINER:-rezerwacje-db}"  # ✅ FIXED: Poprawna nazwa kontenera

# Baza danych
DB_NAME="${POSTGRES_DB:-rezerwacje}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Rotacja backupów (ile dni przechowywać)
RETENTION_DAYS=${RETENTION_DAYS:-7}

# ===== FUNKCJE =====

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
    exit 1
}

check_dependencies() {
    log "Sprawdzam zależności..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker nie jest zainstalowany"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose nie jest zainstalowany"
    fi
    
    log "✓ Wszystkie zależności dostępne"
}

create_directories() {
    log "Tworzę strukturę katalogów..."
    
    mkdir -p "${BACKUP_DIR}/database"
    mkdir -p "${BACKUP_DIR}/files"
    mkdir -p "${BACKUP_DIR}/logs"
    
    log "✓ Katalogi utworzone"
}

backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/database/db_backup_${timestamp}.sql.gz"
    
    log "Rozpoczynam backup bazy danych..."
    log "  - Szukam kontenera: ${DB_CONTAINER_NAME}"
    
    # Sprawdź czy kontener działa
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
        # Wypisz dostępne kontenery dla debugowania
        log "Dostępne kontenery:"
        docker ps --format '{{.Names}}' | while read container; do
            log "  - ${container}"
        done
        error "Kontener bazy danych '${DB_CONTAINER_NAME}' nie jest uruchomiony"
    fi
    
    log "  - Kontener znaleziony: ${DB_CONTAINER_NAME}"
    log "  - Wykonuję pg_dump dla bazy: ${DB_NAME}"
    
    # Wykonaj dump bazy
    if docker exec "${DB_CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${backup_file}"; then
        local size=$(du -h "${backup_file}" | cut -f1)
        log "✓ Backup bazy danych utworzony: ${backup_file} (${size})"
        echo "${backup_file}"
    else
        error "Nie udało się utworzyć backupu bazy danych"
    fi
}

backup_files() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/files/files_backup_${timestamp}.tar.gz"
    
    log "Rozpoczynam backup plików aplikacji..."
    
    # Lista katalogów/plików do backupu
    local items_to_backup=(
        "apps"
        "docker-compose.yml"
        ".env"
        "package.json"
        "tsconfig.json"
        "README.md"
        "scripts"
        "docs"
    )
    
    # Tworzenie archiwum
    cd "${PROJECT_DIR}"
    
    local tar_items=""
    for item in "${items_to_backup[@]}"; do
        if [ -e "$item" ]; then
            tar_items="${tar_items} ${item}"
        fi
    done
    
    if [ -n "${tar_items}" ]; then
        # ✅ FIXED: --exclude musi być PRZED nazwą plików!
        if tar -czf "${backup_file}" --exclude='node_modules' --exclude='dist' --exclude='.next' --exclude='coverage' ${tar_items} 2>> "$LOG_FILE"; then
            local size=$(du -h "${backup_file}" | cut -f1)
            log "✓ Backup plików utworzony: ${backup_file} (${size})"
            echo "${backup_file}"
        else
            error "Nie udało się utworzyć backupu plików"
        fi
    else
        log "⚠ Brak plików do backupu"
    fi
}

cleanup_old_backups() {
    log "Usuwam stare backupy (starsze niż ${RETENTION_DAYS} dni)..."
    
    local deleted_count=0
    
    # Usuń stare backupy bazy
    if [ -d "${BACKUP_DIR}/database" ]; then
        deleted_count=$(find "${BACKUP_DIR}/database" -name "db_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
        log "  - Usunięto ${deleted_count} starych backupów bazy"
    fi
    
    # Usuń stare backupy plików
    if [ -d "${BACKUP_DIR}/files" ]; then
        deleted_count=$(find "${BACKUP_DIR}/files" -name "files_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
        log "  - Usunięto ${deleted_count} starych backupów plików"
    fi
    
    log "✓ Czyszczenie zakończone"
}

generate_backup_info() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local info_file="${BACKUP_DIR}/backup_info_${timestamp}.txt"
    
    cat > "${info_file}" <<EOF
===========================================
Backup Information
===========================================
Data: $(date '+%Y-%m-%d %H:%M:%S')
System: Gościniec_2 - System Rezerwacji

Konfiguracja:
- Projekt: ${PROJECT_DIR}
- Katalog backupów: ${BACKUP_DIR}
- Baza danych: ${DB_NAME}
- Kontener DB: ${DB_CONTAINER_NAME}
- Retencja: ${RETENTION_DAYS} dni

Backup utworzony przez: $(whoami)@$(hostname)
EOF
    
    log "✓ Informacje o backupie zapisane: ${info_file}"
}

show_summary() {
    log ""
    log "==========================================="
    log "        PODSUMOWANIE BACKUPU"
    log "==========================================="
    log "Data: $(date '+%Y-%m-%d %H:%M:%S')"
    log "Lokalizacja: ${BACKUP_DIR}"
    
    # Statystyki backupów
    local db_count=$(find "${BACKUP_DIR}/database" -name "db_backup_*.sql.gz" -type f 2>/dev/null | wc -l)
    local files_count=$(find "${BACKUP_DIR}/files" -name "files_backup_*.tar.gz" -type f 2>/dev/null | wc -l)
    local total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    
    log "Liczba backupów bazy: ${db_count}"
    log "Liczba backupów plików: ${files_count}"
    log "Całkowity rozmiar: ${total_size}"
    log "==========================================="
    log ""
}

# ===== GŁÓWNA FUNKCJA =====

main() {
    log "========================================="
    log "   START BACKUP - Gościniec_2"
    log "========================================="
    
    check_dependencies
    create_directories
    
    # Wykonaj backupy
    backup_database
    backup_files
    
    # Cleanup
    cleanup_old_backups
    
    # Informacje
    generate_backup_info
    show_summary
    
    log "✓ BACKUP ZAKOŃCZONY POMYŚLNIE"
    log "========================================="
}

# ===== URUCHOMIENIE =====

# Sprawdź czy skrypt jest uruchamiany z odpowiednimi uprawnieniami
if [ "$EUID" -eq 0 ]; then
    log "⚠ UWAGA: Skrypt uruchomiony jako root. Rozważ użycie dedykowanego użytkownika."
fi

# Uruchom główną funkcję
main "$@"

exit 0
