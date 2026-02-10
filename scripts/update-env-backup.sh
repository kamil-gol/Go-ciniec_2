#!/bin/bash

################################################################################
# Skrypt Aktualizacji .env.backup
# Automatycznie tworzy .env.backup z właściwymi credentials
# Author: System Rezerwacji
# Version: 1.0.0
################################################################################

set -e

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "   Aktualizacja .env.backup"
echo "========================================="
echo ""

# Katalog projektu
PROJECT_DIR="/home/kamil/rezerwacje"
ENV_FILE="${PROJECT_DIR}/.env.backup"

cd "$PROJECT_DIR"

# Pobierz credentials z działającego kontenera
echo "Pobieranie credentials z kontenera rezerwacje-db..."

if ! docker ps --format '{{.Names}}' | grep -q "rezerwacje-db"; then
    echo -e "${YELLOW}⚠ Kontener rezerwacje-db nie działa!${NC}"
    echo "Uruchom: docker-compose up -d"
    exit 1
fi

DB_USER=$(docker exec rezerwacje-db env | grep "^POSTGRES_USER=" | cut -d= -f2)
DB_PASS=$(docker exec rezerwacje-db env | grep "^POSTGRES_PASSWORD=" | cut -d= -f2)
DB_NAME=$(docker exec rezerwacje-db env | grep "^POSTGRES_DB=" | cut -d= -f2)

echo -e "${GREEN}✓${NC} Credentials pobrane:"
echo "  - POSTGRES_USER: $DB_USER"
echo "  - POSTGRES_DB: $DB_NAME"
echo "  - POSTGRES_PASSWORD: ***"
echo ""

# Utwórz .env.backup
echo "Tworzenie $ENV_FILE..."

cat > "$ENV_FILE" <<EOF
# ===========================================
# Konfiguracja Backup - Gościniec Rodzinny
# ===========================================
# Wygenerowano automatycznie: $(date '+%Y-%m-%d %H:%M:%S')
# NIE COMMITUJ tego pliku do repo!

# Katalog gdzie będą przechowywane backupy
BACKUP_DIR=/home/kamil/backups/gosciniec

# Katalog projektu
PROJECT_DIR=/home/kamil/rezerwacje

# Nazwa kontenera Docker z bazą danych
DB_CONTAINER=rezerwacje-db

# Credentials do PostgreSQL (pobrane automatycznie z kontenera)
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASS}

# Retencja backupów (30 dni = ~1 miesiąc historii)
RETENTION_DAYS=30
EOF

# Zabezpiecz plik
chmod 600 "$ENV_FILE"

echo -e "${GREEN}✓${NC} Plik utworzony: $ENV_FILE"
echo -e "${GREEN}✓${NC} Uprawnienia ustawione: 600 (tylko root)"
echo ""

# Test backupu
echo "Testowanie backupu..."
echo ""

source "$ENV_FILE"
./scripts/backup.sh

echo ""
echo "========================================="
echo -e "${GREEN}✓ Konfiguracja zakończona pomyślnie!${NC}"
echo "========================================="
echo ""
echo "Cron uruchomi automatyczny backup co godzinę."
echo "Backupy będą przechowywane przez 30 dni."
echo ""
echo "Monitorowanie:"
echo "  tail -f /home/kamil/backups/gosciniec/cron.log"
echo ""
