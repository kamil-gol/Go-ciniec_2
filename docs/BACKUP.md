# 📦 System Backupów - Gościniec_2

Kompletny system backupów dla aplikacji rezerwacji.

## 📋 Spis Treści

- [Funkcjonalności](#funkcjonalności)
- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Użycie](#użycie)
- [Automatyzacja](#automatyzacja)
- [Przywracanie](#przywracanie)
- [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## ✨ Funkcjonalności

### ✅ Co Jest Backupowane?

1. **Baza Danych PostgreSQL**
   - Pełny dump bazy danych
   - Kompresja gzip
   - Wszystkie tabele, indeksy, relacje

2. **Pliki Aplikacji**
   - Kod źródłowy (`apps/`)
   - Konfiguracja (`docker-compose.yml`, `.env`)
   - Dokumentacja (`docs/`, `README.md`)
   - Skrypty (`scripts/`)

3. **Rotacja Backupów**
   - Automatyczne usuwanie starych backupów
   - Konfigurowalna retencja (domyślnie 7 dni)

4. **Logowanie**
   - Pełne logi operacji
   - Timestampy wszystkich operacji
   - Informacje o rozmiarach backupów

---

## 🚀 Instalacja

### Krok 1: Sklonuj Repozytorium

```bash
cd /home/kamil
git clone https://github.com/kamil-gol/Go-ciniec_2.git rezerwacje
cd rezerwacje
```

### Krok 2: Nadaj Uprawnienia Skryptom

```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

### Krok 3: Utwórz Katalog Backupów

```bash
mkdir -p /home/kamil/backups/gosciniec
```

---

## ⚙️ Konfiguracja

### Zmienne Środowiskowe

Skrypty używają następujących zmiennych (z wartościami domyślnymi):

```bash
# Katalogi
export BACKUP_DIR="/home/kamil/backups/gosciniec"    # Gdzie przechować backupy
export PROJECT_DIR="/home/kamil/rezerwacje"           # Katalog projektu

# Docker
export DB_CONTAINER="postgres"                        # Nazwa kontenera bazy

# Baza danych
export POSTGRES_DB="rezerwacje"                       # Nazwa bazy
export POSTGRES_USER="postgres"                       # Użytkownik bazy
export POSTGRES_PASSWORD="postgres"                   # Hasło do bazy

# Retencja
export RETENTION_DAYS=7                               # Ile dni przechowywać backupy
```

### Plik Konfiguracyjny (Opcjonalnie)

Możesz utworzyć plik `.env.backup`:

```bash
# /home/kamil/rezerwacje/.env.backup
BACKUP_DIR=/home/kamil/backups/gosciniec
PROJECT_DIR=/home/kamil/rezerwacje
DB_CONTAINER=postgres
POSTGRES_DB=rezerwacje
POSTGRES_USER=postgres
POSTGRES_PASSWORD=twoje_haslo
RETENTION_DAYS=14
```

I załadować przed uruchomieniem:

```bash
source .env.backup
./scripts/backup.sh
```

---

## 💻 Użycie

### Ręczne Tworzenie Backupu

```bash
cd /home/kamil/rezerwacje
./scripts/backup.sh
```

**Przykładowy output:**

```
=========================================
   START BACKUP - Gościniec_2
=========================================
[2026-02-09 10:00:00] Sprawdzam zależności...
[2026-02-09 10:00:01] ✓ Wszystkie zależności dostępne
[2026-02-09 10:00:01] Tworzę strukturę katalogów...
[2026-02-09 10:00:01] ✓ Katalogi utworzone
[2026-02-09 10:00:02] Rozpoczynam backup bazy danych...
[2026-02-09 10:00:05] ✓ Backup bazy danych utworzony: db_backup_20260209_100002.sql.gz (2.3M)
[2026-02-09 10:00:05] Rozpoczynam backup plików aplikacji...
[2026-02-09 10:00:08] ✓ Backup plików utworzony: files_backup_20260209_100005.tar.gz (15M)
[2026-02-09 10:00:08] ✓ BACKUP ZAKOŃCZONY POMYŚLNIE
```

### Sprawdzenie Statusów

```bash
# Zobacz wszystkie backupy
ls -lh /home/kamil/backups/gosciniec/database/
ls -lh /home/kamil/backups/gosciniec/files/

# Zobacz logi
tail -f /home/kamil/backups/gosciniec/backup.log
```

---

## ⏰ Automatyzacja

### Cron - Automatyczne Backupy

#### Codziennie o 2:00 w nocy

```bash
# Edytuj crontab
crontab -e

# Dodaj linię:
0 2 * * * cd /home/kamil/rezerwacje && ./scripts/backup.sh >> /home/kamil/backups/gosciniec/cron.log 2>&1
```

#### Co 6 godzin

```bash
0 */6 * * * cd /home/kamil/rezerwacje && ./scripts/backup.sh >> /home/kamil/backups/gosciniec/cron.log 2>&1
```

#### Raz w tygodniu (niedziela 3:00)

```bash
0 3 * * 0 cd /home/kamil/rezerwacje && ./scripts/backup.sh >> /home/kamil/backups/gosciniec/cron.log 2>&1
```

### Systemd Timer (Alternatywa)

Utwórz service i timer:

```bash
# /etc/systemd/system/gosciniec-backup.service
[Unit]
Description=Gościniec_2 Backup Service

[Service]
Type=oneshot
User=kamil
WorkingDirectory=/home/kamil/rezerwacje
ExecStart=/home/kamil/rezerwacje/scripts/backup.sh
StandardOutput=append:/home/kamil/backups/gosciniec/systemd.log
StandardError=append:/home/kamil/backups/gosciniec/systemd.log
```

```bash
# /etc/systemd/system/gosciniec-backup.timer
[Unit]
Description=Gościniec_2 Backup Timer

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Aktywacja:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gosciniec-backup.timer
sudo systemctl start gosciniec-backup.timer

# Sprawdzenie statusu
sudo systemctl status gosciniec-backup.timer
sudo systemctl list-timers
```

---

## ♻️ Przywracanie

### Lista Dostępnych Backupów

```bash
./scripts/restore.sh --list
```

**Output:**

```
=========================================
   DOSTĘPNE BACKUPY
=========================================

BAZA DANYCH:
  1. db_backup_20260209_100002.sql.gz - 2.3M - 2026-02-09 10:00:02
  2. db_backup_20260208_020001.sql.gz - 2.1M - 2026-02-08 02:00:01

PLIKI APLIKACJI:
  1. files_backup_20260209_100005.tar.gz - 15M - 2026-02-09 10:00:05
  2. files_backup_20260208_020003.tar.gz - 14M - 2026-02-08 02:00:03
=========================================
```

### Przywracanie Najnowszej Bazy

```bash
./scripts/restore.sh --database
```

### Przywracanie Konkretnej Bazy

```bash
./scripts/restore.sh --database /home/kamil/backups/gosciniec/database/db_backup_20260208_020001.sql.gz
```

### Przywracanie Plików

```bash
./scripts/restore.sh --files
```

### Przywracanie Wszystkiego

```bash
./scripts/restore.sh --all
```

### Po Restore - Restart Aplikacji

```bash
cd /home/kamil/rezerwacje
docker-compose restart

# Lub pełny restart
docker-compose down
docker-compose up -d
```

---

## ⚠️ Ważne Informacje

### Bezpieczeństwo

1. **Hasła w zmiennych** - Upewnij się, że pliki `.env.backup` nie są w repo Git
2. **Uprawnienia** - Backup dir powinien mieć ograniczone uprawnienia: `chmod 700`
3. **Kopie zdalne** - Rozważ synchronizację backupów na zdalny serwer (rsync, rclone)

### Miejsce na Dysku

```bash
# Sprawdź rozmiar backupów
du -sh /home/kamil/backups/gosciniec/

# Sprawdź wolne miejsce
df -h
```

Przy ustawieniu `RETENTION_DAYS=7` i codziennych backupach:
- **Baza:** ~7 × 2-3 MB = ~20 MB
- **Pliki:** ~7 × 15 MB = ~105 MB
- **Łącznie:** ~125 MB

---

## 🔧 Rozwiązywanie Problemów

### Problem: "Docker nie jest zainstalowany"

```bash
# Sprawdź instalację
docker --version
docker-compose --version

# Zainstaluj jeśli brak
sudo apt update
sudo apt install docker.io docker-compose
```

### Problem: "Kontener bazy danych nie jest uruchomiony"

```bash
# Sprawdź status
docker ps

# Uruchom aplikację
cd /home/kamil/rezerwacje
docker-compose up -d

# Sprawdź logi
docker-compose logs postgres
```

### Problem: "Permission denied"

```bash
# Nadaj uprawnienia skryptom
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh

# Nadaj uprawnienia katalogowi backupów
chmod 700 /home/kamil/backups/gosciniec
```

### Problem: "Brak miejsca na dysku"

```bash
# Sprawdź miejsce
df -h

# Usuń stare backupy ręcznie
find /home/kamil/backups/gosciniec/database -name "*.sql.gz" -mtime +30 -delete
find /home/kamil/backups/gosciniec/files -name "*.tar.gz" -mtime +30 -delete

# Lub zmniejsz RETENTION_DAYS
export RETENTION_DAYS=3
```

### Problem: "Restore nie działa - połączenia z bazą"

```bash
# Zatrzymaj aplikację przed restore
cd /home/kamil/rezerwacje
docker-compose stop backend frontend

# Wykonaj restore
./scripts/restore.sh --database

# Uruchom ponownie
docker-compose start
```

---

## 📊 Monitoring

### Sprawdzanie Logów

```bash
# Ostatnie 50 linii
tail -n 50 /home/kamil/backups/gosciniec/backup.log

# Śledzenie w czasie rzeczywistym
tail -f /home/kamil/backups/gosciniec/backup.log

# Szukanie błędów
grep ERROR /home/kamil/backups/gosciniec/backup.log
```

### Statystyki Backupów

```bash
# Liczba backupów
echo "Backupy bazy: $(find /home/kamil/backups/gosciniec/database -name '*.sql.gz' | wc -l)"
echo "Backupy plików: $(find /home/kamil/backups/gosciniec/files -name '*.tar.gz' | wc -l)"

# Rozmiar
du -sh /home/kamil/backups/gosciniec/*
```

---

## 🚀 Zaawansowane

### Synchronizacja do Zdalnego Serwera

```bash
# Użyj rsync do synchronizacji backupów
rsync -avz --delete /home/kamil/backups/gosciniec/ user@backup-server:/backups/gosciniec/

# Lub rclone (Google Drive, S3, itp.)
rclone sync /home/kamil/backups/gosciniec/ remote:gosciniec-backups/
```

### Powiadomienia Email

Dodaj do skryptu backup.sh:

```bash
# Na końcu skryptu
echo "Backup zakończony: $(date)" | mail -s "Gościniec Backup OK" admin@example.com
```

### Webhook Notification (Discord/Slack)

```bash
# Dodaj na końcu backup.sh
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Backup Gościnca zakończony!"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 📝 Podsumowanie

### Szybki Start

```bash
# 1. Instalacja
chmod +x scripts/*.sh
mkdir -p /home/kamil/backups/gosciniec

# 2. Test
./scripts/backup.sh

# 3. Automatyzacja
crontab -e
# Dodaj: 0 2 * * * cd /home/kamil/rezerwacje && ./scripts/backup.sh

# 4. Weryfikacja
./scripts/restore.sh --list
```

### Czecklista

- [ ] Skrypty mają uprawnienia wykonywania
- [ ] Katalog backupów utworzony
- [ ] Test ręcznego backupu działa
- [ ] Cron skonfigurowany
- [ ] Test restore działa
- [ ] Logi są monitorowane
- [ ] Miejsce na dysku wystarczające

---

## 📞 Wsparcie

W razie problemów sprawdź:
- Logi: `/home/kamil/backups/gosciniec/backup.log`
- Status Docker: `docker ps`
- Miejsce na dysku: `df -h`

**Repository:** https://github.com/kamil-gol/Go-ciniec_2  
**Issues:** https://github.com/kamil-gol/Go-ciniec_2/issues
