#!/bin/bash

################################################################################
# Skrypt Diagnostyczny dla Cron Backup
# Sprawdza dlaczego cron nie odpala backup.sh
# Author: System Rezerwacji
# Version: 1.0.0
################################################################################

echo "========================================="
echo "   DIAGNOSTYKA CRON BACKUP"
echo "========================================="
echo ""

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ===== 1. SPRAWDZ CRON DAEMON =====
echo "[1] Sprawdzam cron daemon..."
if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
    check_ok "Cron daemon działa"
else
    check_fail "Cron daemon NIE działa!"
    echo "    Uruchom: systemctl start cron"
fi
echo ""

# ===== 2. SPRAWDZ CRONTAB =====
echo "[2] Sprawdzam crontab root..."
if crontab -l &>/dev/null; then
    check_ok "Crontab istnieje"
    echo "    Treść crontab:"
    crontab -l | grep -v "^#" | grep -v "^$" | while read line; do
        echo "    $line"
    done
else
    check_fail "Crontab NIE istnieje dla root"
fi
echo ""

# ===== 3. SPRAWDZ PLIK BACKUP.SH =====
echo "[3] Sprawdzam skrypt backup.sh..."
BACKUP_SCRIPT="/home/kamil/rezerwacje/scripts/backup.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    check_ok "Plik istnieje: $BACKUP_SCRIPT"
    
    # Sprawdz uprawnienia
    if [ -x "$BACKUP_SCRIPT" ]; then
        check_ok "Plik jest wykonywalny"
    else
        check_fail "Plik NIE jest wykonywalny!"
        echo "    Napraw: chmod +x $BACKUP_SCRIPT"
    fi
    
    # Pokaz uprawnienia
    echo "    Uprawnienia: $(ls -lh $BACKUP_SCRIPT | awk '{print $1, $3, $4}')"
else
    check_fail "Plik NIE istnieje: $BACKUP_SCRIPT"
fi
echo ""

# ===== 4. SPRAWDZ PLIK .env.backup =====
echo "[4] Sprawdzam plik .env.backup..."
ENV_FILE="/home/kamil/rezerwacje/.env.backup"

if [ -f "$ENV_FILE" ]; then
    check_ok "Plik istnieje: $ENV_FILE"
    
    # Sprawdz czy ma wymagane zmienne
    echo "    Zmienne w pliku:"
    grep -E "^[A-Z_]+=" "$ENV_FILE" 2>/dev/null | sed 's/=.*/=***/' | while read line; do
        echo "      $line"
    done
    
    # Sprawdz kluczowe zmienne
    if grep -q "BACKUP_DIR=" "$ENV_FILE"; then
        check_ok "BACKUP_DIR zdefiniowany"
    else
        check_warn "BACKUP_DIR niezdefiniowany (użyje default)"
    fi
    
    if grep -q "DB_CONTAINER=" "$ENV_FILE"; then
        check_ok "DB_CONTAINER zdefiniowany"
    else
        check_warn "DB_CONTAINER niezdefiniowany (użyje default)"
    fi
else
    check_fail "Plik NIE istnieje: $ENV_FILE"
    echo "    Utwórz plik z wymaganymi zmiennymi:"
    echo "    BACKUP_DIR=/home/kamil/backups/gosciniec"
    echo "    PROJECT_DIR=/home/kamil/rezerwacje"
    echo "    DB_CONTAINER=rezerwacje-db"
    echo "    POSTGRES_DB=rezerwacje"
    echo "    POSTGRES_USER=postgres"
    echo "    POSTGRES_PASSWORD=***"
fi
echo ""

# ===== 5. SPRAWDZ KATALOG BACKUPOW =====
echo "[5] Sprawdzam katalog backupów..."
BACKUP_DIR="/home/kamil/backups/gosciniec"

if [ -d "$BACKUP_DIR" ]; then
    check_ok "Katalog istnieje: $BACKUP_DIR"
    
    # Sprawdz uprawnienia zapisu
    if [ -w "$BACKUP_DIR" ]; then
        check_ok "Katalog ma uprawnienia do zapisu"
    else
        check_fail "Katalog NIE ma uprawnień do zapisu!"
        echo "    Napraw: chown -R root:root $BACKUP_DIR"
        echo "    Napraw: chmod -R 755 $BACKUP_DIR"
    fi
    
    # Pokaz uprawnienia
    echo "    Uprawnienia: $(ls -ldh $BACKUP_DIR | awk '{print $1, $3, $4}')"
    
    # Sprawdz ile jest backupów
    local db_count=$(find "$BACKUP_DIR/database" -name "*.sql.gz" 2>/dev/null | wc -l)
    local files_count=$(find "$BACKUP_DIR/files" -name "*.tar.gz" 2>/dev/null | wc -l)
    echo "    Backupy bazy: $db_count"
    echo "    Backupy plików: $files_count"
else
    check_fail "Katalog NIE istnieje: $BACKUP_DIR"
    echo "    Utwórz: mkdir -p $BACKUP_DIR"
fi
echo ""

# ===== 6. SPRAWDZ LOGI CRONA =====
echo "[6] Sprawdzam logi crona..."
CRON_LOG="/home/kamil/backups/gosciniec/cron.log"

if [ -f "$CRON_LOG" ]; then
    check_ok "Plik loga istnieje: $CRON_LOG"
    
    # Pokaz ostatnie 10 linii
    echo "    Ostatnie wpisy:"
    tail -n 10 "$CRON_LOG" 2>/dev/null | while read line; do
        echo "      $line"
    done
else
    check_warn "Plik loga NIE istnieje: $CRON_LOG"
    echo "    To może oznaczać, że cron nigdy nie uruchomił skryptu"
fi
echo ""

# ===== 7. SPRAWDZ LOGI SYSTEMOWE CRONA =====
echo "[7] Sprawdzam logi systemowe crona..."
if [ -f /var/log/syslog ]; then
    echo "    Ostatnie wpisy crona (z syslog):"
    grep CRON /var/log/syslog | tail -n 5 | while read line; do
        echo "      $line"
    done
elif [ -f /var/log/cron ]; then
    echo "    Ostatnie wpisy crona (z /var/log/cron):"
    tail -n 5 /var/log/cron | while read line; do
        echo "      $line"
    done
else
    check_warn "Brak dostępu do logów systemowych"
fi
echo ""

# ===== 8. SPRAWDZ KONTENERY DOCKER =====
echo "[8] Sprawdzam kontenery Docker..."
if command -v docker &> /dev/null; then
    check_ok "Docker zainstalowany"
    
    echo "    Działające kontenery:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | while read line; do
        echo "      $line"
    done
    
    # Sprawdz kontener bazy
    if docker ps --format '{{.Names}}' | grep -q "rezerwacje-db"; then
        check_ok "Kontener rezerwacje-db działa"
    else
        check_fail "Kontener rezerwacje-db NIE działa!"
        echo "    Uruchom: docker-compose up -d"
    fi
else
    check_fail "Docker nie zainstalowany!"
fi
echo ""

# ===== 9. TEST MANUALNY SKRYPTU =====
echo "[9] Test manualny skryptu backup.sh..."
echo "    Uruchamiam test..."
echo ""

if [ -f "$BACKUP_SCRIPT" ] && [ -x "$BACKUP_SCRIPT" ]; then
    cd /home/kamil/rezerwacje
    
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi
    
    # Uruchom w trybie testowym (tylko check)
    echo "==========================================="
    bash "$BACKUP_SCRIPT" 2>&1 | head -n 20
    echo "==========================================="
    echo ""
    
    if [ $? -eq 0 ]; then
        check_ok "Skrypt działa poprawnie!"
    else
        check_fail "Skrypt zwrócił błąd!"
    fi
else
    check_warn "Pominięto test - skrypt nie istnieje lub nie jest wykonywalny"
fi
echo ""

# ===== 10. PODSUMOWANIE I REKOMENDACJE =====
echo "========================================="
echo "        PODSUMOWANIE"
echo "========================================="
echo ""

echo "NAJCZĘSTSZE PROBLEMY:"
echo ""
echo "1. Skrypt nie ma uprawnień +x"
echo "   Rozwiązanie: chmod +x /home/kamil/rezerwacje/scripts/backup.sh"
echo ""
echo "2. Brak pliku .env.backup"
echo "   Rozwiązanie: Utwórz plik z wymaganymi zmiennymi"
echo ""
echo "3. Cron daemon nie działa"
echo "   Rozwiązanie: systemctl start cron"
echo ""
echo "4. Zła ścieżka w crontab"
echo "   Rozwiązanie: Użyj pełnych ścieżek (nie relatywnych)"
echo ""
echo "5. Brak katalogu backupów"
echo "   Rozwiązanie: mkdir -p /home/kamil/backups/gosciniec"
echo ""
echo "6. Błędna nazwa kontenera Docker"
echo "   Rozwiązanie: Sprawdź nazwę przez: docker ps"
echo ""

echo "REKOMENDOWANY FIX:"
echo "-------------------"
echo "# 1. Nadaj uprawnienia"
echo "chmod +x /home/kamil/rezerwacje/scripts/backup.sh"
echo ""
echo "# 2. Utwórz .env.backup"
echo "cat > /home/kamil/rezerwacje/.env.backup <<EOF"
echo "BACKUP_DIR=/home/kamil/backups/gosciniec"
echo "PROJECT_DIR=/home/kamil/rezerwacje"
echo "DB_CONTAINER=rezerwacje-db"
echo "POSTGRES_DB=rezerwacje"
echo "POSTGRES_USER=postgres"
echo "POSTGRES_PASSWORD=twoje_haslo"
echo "RETENTION_DAYS=7"
echo "EOF"
echo ""
echo "# 3. Utwórz katalog backupów"
echo "mkdir -p /home/kamil/backups/gosciniec"
echo ""
echo "# 4. Test manualny"
echo "cd /home/kamil/rezerwacje && source .env.backup && ./scripts/backup.sh"
echo ""
echo "# 5. Sprawdź logi"
echo "tail -f /home/kamil/backups/gosciniec/cron.log"
echo ""

echo "========================================="
echo "   KONIEC DIAGNOSTYKI"
echo "========================================="
