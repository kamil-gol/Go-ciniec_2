#!/bin/bash

################################################################################
# Skrypt Restore dla Gościniec_2
# Przywraca backup bazy PostgreSQL + plików aplikacji
# Author: System Rezerwacji
# Version: 1.0.0
################################################################################

set -e  # Zatrzymaj na błędzie

# ===== KONFIGURACJA =====

# Katalogi
BACKUP_DIR="${BACKUP_DIR:-/home/kamil/backups/gosciniec}"
PROJECT_DIR="${PROJECT_DIR:-/home/kamil/rezerwacje}"
LOG_FILE="${BACKUP_DIR}/restore.log"

# Konfiguracja Docker
DOCKER_COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
DB_CONTAINER_NAME="${DB_CONTAINER:-postgres}"

# Baza danych
DB_NAME="${POSTGRES_DB:-rezerwacje}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# ===== FUNKCJE =====

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
    exit 1
}

warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] UWAGA: $1" | tee -a "$LOG_FILE"
}

list_available_backups() {
    log ""
    log "========================================="
    log "   DOSTĘPNE BACKUPY"
    log "========================================="
    
    log ""
    log "BAZA DANYCH:"
    if [ -d "${BACKUP_DIR}/database" ]; then
        local count=1
        while IFS= read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
            log "  ${count}. $(basename "$file") - ${size} - ${date}"
            count=$((count + 1))
        done < <(find "${BACKUP_DIR}/database" -name "db_backup_*.sql.gz" -type f | sort -r)
    else
        log "  Brak backupów bazy danych"
    fi
    
    log ""
    log "PLIKI APLIKACJI:"
    if [ -d "${BACKUP_DIR}/files" ]; then
        local count=1
        while IFS= read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
            log "  ${count}. $(basename "$file") - ${size} - ${date}"
            count=$((count + 1))
        done < <(find "${BACKUP_DIR}/files" -name "files_backup_*.tar.gz" -type f | sort -r)
    else
        log "  Brak backupów plików"
    fi
    
    log "========================================="
    log ""
}

get_latest_backup() {
    local backup_type=$1
    local pattern=""
    local search_dir=""
    
    case "$backup_type" in
        "database")
            pattern="db_backup_*.sql.gz"
            search_dir="${BACKUP_DIR}/database"
            ;;
        "files")
            pattern="files_backup_*.tar.gz"
            search_dir="${BACKUP_DIR}/files"
            ;;
        *)
            error "Nieznany typ backupu: $backup_type"
            ;;
    esac
    
    if [ ! -d "$search_dir" ]; then
        error "Katalog backupów nie istnieje: $search_dir"
    fi
    
    local latest=$(find "$search_dir" -name "$pattern" -type f | sort -r | head -n1)
    
    if [ -z "$latest" ]; then
        error "Nie znaleziono backupów typu: $backup_type"
    fi
    
    echo "$latest"
}

confirm_action() {
    local message=$1
    warning "$message"
    warning "Ta operacja jest NIEODWRACALNA!"
    
    read -p "Czy na pewno chcesz kontynuować? (wpisz 'TAK' aby potwierdzić): " confirmation
    
    if [ "$confirmation" != "TAK" ]; then
        log "Operacja anulowana przez użytkownika"
        exit 0
    fi
}

restore_database() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Plik backupu nie istnieje: $backup_file"
    fi
    
    log "Rozpoczynam przywracanie bazy danych z: $(basename "$backup_file")"
    
    # Sprawdź czy kontener działa
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
        error "Kontener bazy danych '${DB_CONTAINER_NAME}' nie jest uruchomiony"
    fi
    
    # Potwierdź operację
    confirm_action "PRZYWRACANIE BAZY DANYCH usunie wszystkie bieżące dane!"
    
    # Zatrzymaj połączenia z bazą
    log "Zamykam połączenia z bazą..."
    docker exec "${DB_CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" 2>/dev/null || true
    
    # Usuń i utwórz nową bazę
    log "Odtwarzam bazę danych..."
    docker exec "${DB_CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" || error "Nie udało się usunąć bazy"
    docker exec "${DB_CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};" || error "Nie udało się utworzyć bazy"
    
    # Przywroć dane
    log "Przywracam dane..."
    gunzip -c "$backup_file" | docker exec -i "${DB_CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" || error "Nie udało się przywrocić danych"
    
    log "✓ Baza danych przywrocona pomyślnie"
}

restore_files() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Plik backupu nie istnieje: $backup_file"
    fi
    
    log "Rozpoczynam przywracanie plików z: $(basename "$backup_file")"
    
    # Potwierdź operację
    confirm_action "PRZYWRACANIE PLIKÓW nadpisze bieżące pliki!"
    
    # Utwórz katalog tymczasowy
    local temp_dir=$(mktemp -d)
    log "Wypakowuję pliki do katalogu tymczasowego..."
    
    tar -xzf "$backup_file" -C "$temp_dir" || error "Nie udało się wypakować archiwum"
    
    # Przenieś pliki
    log "Kopiuję pliki do katalogu projektu..."
    cp -rf "${temp_dir}"/* "${PROJECT_DIR}/" || error "Nie udało się skopiować plików"
    
    # Usuń katalog tymczasowy
    rm -rf "$temp_dir"
    
    log "✓ Pliki przywrocone pomyślnie"
}

show_usage() {
    cat << EOF
Użycie: $0 [OPCJE]

Opcje:
  -h, --help              Pokaż tę pomoc
  -l, --list              Lista dostępnych backupów
  -d, --database [FILE]   Przywroć bazę danych (najnowszy lub podany plik)
  -f, --files [FILE]      Przywroć pliki (najnowszy lub podany plik)
  -a, --all              Przywroć wszystko (bazę i pliki)

Przykłady:
  $0 --list                                    # Lista backupów
  $0 --database                                # Przywroć najnowszą bazę
  $0 --database /path/to/db_backup.sql.gz     # Przywroć konkretną bazę
  $0 --all                                     # Przywroć wszystko

EOF
}

# ===== GŁÓWNA FUNKCJA =====

main() {
    local restore_db=false
    local restore_files_flag=false
    local db_file=""
    local files_file=""
    
    # Parsowanie argumentów
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -l|--list)
                list_available_backups
                exit 0
                ;;
            -d|--database)
                restore_db=true
                if [[ -n $2 && $2 != -* ]]; then
                    db_file=$2
                    shift
                fi
                shift
                ;;
            -f|--files)
                restore_files_flag=true
                if [[ -n $2 && $2 != -* ]]; then
                    files_file=$2
                    shift
                fi
                shift
                ;;
            -a|--all)
                restore_db=true
                restore_files_flag=true
                shift
                ;;
            *)
                error "Nieznana opcja: $1. Użyj -h dla pomocy."
                ;;
        esac
    done
    
    # Sprawdzenie czy wybrano jakąś opcję
    if [ "$restore_db" = false ] && [ "$restore_files_flag" = false ]; then
        show_usage
        exit 1
    fi
    
    log "========================================="
    log "   START RESTORE - Gościniec_2"
    log "========================================="
    
    # Przywracanie bazy
    if [ "$restore_db" = true ]; then
        if [ -z "$db_file" ]; then
            db_file=$(get_latest_backup "database")
            log "Używam najnowszego backupu bazy: $(basename "$db_file")"
        fi
        restore_database "$db_file"
    fi
    
    # Przywracanie plików
    if [ "$restore_files_flag" = true ]; then
        if [ -z "$files_file" ]; then
            files_file=$(get_latest_backup "files")
            log "Używam najnowszego backupu plików: $(basename "$files_file")"
        fi
        restore_files "$files_file"
    fi
    
    log ""
    log "✓ RESTORE ZAKOŃCZONY POMYŚLNIE"
    log "========================================="
    
    if [ "$restore_db" = true ] || [ "$restore_files_flag" = true ]; then
        warning ""
        warning "UWAGA: Zrestartuj aplikację aby zastosować zmiany:"
        warning "  cd ${PROJECT_DIR}"
        warning "  docker-compose restart"
        warning ""
    fi
}

# ===== URUCHOMIENIE =====

main "$@"

exit 0
