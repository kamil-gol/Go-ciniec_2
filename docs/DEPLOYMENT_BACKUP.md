# 📦 Wdrożenie Systemu Backupów na Serwerze

## 🎯 Cel

Instrukcje wdrożenia automatycznego systemu backupów dla projektu Gościniec_2 na serwerze produkcyjnym.

---

## 📅 Data Wdrożenia

**Planowane:** 09.02.2026

---

## 📦 1. Przygotowanie Serwera

### 1.1 Połącz się z serwerem

```bash
ssh root@vmi3065143.contaboserver.net
# lub
ssh kamil@vmi3065143.contaboserver.net
```

### 1.2 Przejdź do katalogu projektu

```bash
cd /home/kamil/rezerwacje
```

### 1.3 Sprawdź aktualny branch

```bash
git branch
# Powinieneś zobaczyć: * main
```

---

## 🔄 2. Pobranie Nowego Kodu z GitHub

### 2.1 Pull najnowszych zmian z main

```bash
git fetch origin
git pull origin main
```

### 2.2 Sprawdź czy pliki zostały pobrane

```bash
ls -la scripts/backup.sh
ls -la scripts/restore.sh
ls -la .env.backup.example
ls -la docs/BACKUP.md
```

---

## ⚙️ 3. Konfiguracja Systemu Backupów

### 3.1 Stwórz katalog na backupy

```bash
sudo mkdir -p /home/kamil/backups/gosciniec
sudo chown kamil:kamil /home/kamil/backups/gosciniec
chmod 700 /home/kamil/backups/gosciniec
```

### 3.2 Skopiuj przykładowy plik konfiguracyjny

```bash
cp .env.backup.example .env.backup
```

### 3.3 Edytuj konfigurację

```bash
nano .env.backup
```

**Ustaw prawidłowe wartości:**

```bash
# KATALOGI
BACKUP_DIR=/home/kamil/backups/gosciniec
PROJECT_DIR=/home/kamil/rezerwacje

# DOCKER
DB_CONTAINER=postgres  # lub nazwa Twojego kontenera DB

# BAZA DANYCH
POSTGRES_DB=rezerwacje
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TWOJE_PRAWDZIWE_HASŁO  # <- ZMIEŃ TO!

# RETENCJA
RETENTION_DAYS=7  # Przechowuj backupy przez 7 dni
```

**Zapisz:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 3.4 Zabezpiecz plik konfiguracyjny

```bash
chmod 600 .env.backup
ls -la .env.backup  # powinno pokazać: -rw-------
```

### 3.5 Ustaw uprawnienia do skryptów

```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

---

## 🧪 4. Test Ręczny

### 4.1 Test skryptu backup

```bash
# Załaduj konfigurację
source .env.backup

# Uruchom backup
./scripts/backup.sh
```

**Powinieneś zobaczyć:**
```
===========================================
Backup Start: 2026-02-09_10-15-32
===========================================
Creating database backup...
✓ Database backup created: backup-2026-02-09_10-15-32.sql.gz
Creating application files backup...
✓ Application backup created: app-backup-2026-02-09_10-15-32.tar.gz
Cleaning old backups (older than 7 days)...
Backup completed successfully!
===========================================
```

### 4.2 Sprawdź czy backupy zostały stworzone

```bash
ls -lh /home/kamil/backups/gosciniec/
```

**Powinieneś zobaczyć:**
```
backup-2026-02-09_10-15-32.sql.gz         # Backup bazy danych
app-backup-2026-02-09_10-15-32.tar.gz     # Backup plików aplikacji
```

---

## ⏰ 5. Automatyzacja (Cron)

### 5.1 Otwórz crontab

```bash
crontab -e
```

### 5.2 Dodaj zadanie cron (backup codziennie o 2:00 w nocy)

Dodaj na końcu pliku:

```bash
# Backup systemu rezerwacji Gościniec_2 (codziennie o 2:00)
0 2 * * * cd /home/kamil/rezerwacje && source .env.backup && ./scripts/backup.sh >> /home/kamil/backups/gosciniec/cron.log 2>&1
```

**Zapisz:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 5.3 Sprawdź czy cron został dodany

```bash
crontab -l
```

### 5.4 Sprawdź czy cron działa

```bash
sudo systemctl status cron
# lub
sudo service cron status
```

Jeśli nie działa:
```bash
sudo systemctl start cron
# lub
sudo service cron start
```

---

## 🛡️ 6. Weryfikacja Systemu

### 6.1 Test przywracania (opcjonalnie)

**UWAGA:** To nadpisze aktualne dane! Testuj tylko jeśli jesteś pewien!

```bash
# Podejrzyj dostępne backupy
ls -lh /home/kamil/backups/gosciniec/

# Przywracanie
source .env.backup
./scripts/restore.sh backup-2026-02-09_10-15-32.sql.gz
```

### 6.2 Monitoring logów cron

```bash
# Oglądaj logi na żywo
tail -f /home/kamil/backups/gosciniec/cron.log

# Sprawdź ostatnie wpisy
tail -20 /home/kamil/backups/gosciniec/cron.log
```

---

## 📊 7. Monitorowanie Miejsca na Dysku

### 7.1 Sprawdź wykorzystanie dysku

```bash
df -h /home/kamil/backups/
```

### 7.2 Rozmiar katalogów backupów

```bash
du -sh /home/kamil/backups/gosciniec/
du -h /home/kamil/backups/gosciniec/ | sort -h
```

---

## 🔒 8. Bezpieczeństwo

### 8.1 Sprawdź uprawnienia

```bash
ls -la .env.backup           # Powinno: -rw------- (600)
ls -la scripts/backup.sh     # Powinno: -rwxr-xr-x (755)
ls -la scripts/restore.sh    # Powinno: -rwxr-xr-x (755)
ls -ld /home/kamil/backups/gosciniec/  # Powinno: drwx------ (700)
```

### 8.2 Sprawdź czy .env.backup NIE jest w repo

```bash
git status
# .env.backup NIE powinien się pojawić na liście!
```

---

## ✅ 9. Checklist Wdrożenia

- [ ] Połączenie z serwerem
- [ ] Pull najnowszego kodu z GitHub
- [ ] Utworzenie katalogu `/home/kamil/backups/gosciniec`
- [ ] Skopiowanie `.env.backup.example` → `.env.backup`
- [ ] Edycja `.env.backup` (zmiana hasła!)
- [ ] Ustawienie `chmod 600` na `.env.backup`
- [ ] Ustawienie `chmod +x` na skryptach backup/restore
- [ ] Test ręczny backupu
- [ ] Weryfikacja plików backupu w katalogu
- [ ] Dodanie zadania cron
- [ ] Weryfikacja działania crona
- [ ] Sprawdź logi po pierwszym automatycznym backupie

---

## 🔧 10. Rozwiazywanie Problemów

### Problem: Skrypt nie ma uprawnień do wykonania

```bash
chmod +x scripts/backup.sh scripts/restore.sh
```

### Problem: Nie można połączyć się z bazą danych

```bash
# Sprawdź czy kontener Docker działa
docker ps | grep postgres

# Sprawdź nazwę kontenera
docker ps --format "{{.Names}}"

# Zaktualizuj DB_CONTAINER w .env.backup
```

### Problem: Brak miejsca na dysku

```bash
# Sprawdź miejsce
df -h

# Usuń stare backupy ręcznie
rm /home/kamil/backups/gosciniec/backup-2026-01-*.sql.gz

# Lub zmniejsz RETENTION_DAYS w .env.backup
```

### Problem: Cron nie uruchamia skryptu

```bash
# Sprawdź logi systemowe
sudo tail -50 /var/log/syslog | grep CRON

# Sprawdź format crona
crontab -l

# Test ręczny ze ścieżkami bezwzględnymi
cd /home/kamil/rezerwacje && source .env.backup && ./scripts/backup.sh
```

---

## 📞 Kontakt

W razie problemów, sprawdź:
- `docs/BACKUP.md` - pełna dokumentacja systemu
- Logi: `/home/kamil/backups/gosciniec/cron.log`

---

## 🎉 Gotowe!

System backupów jest wdrożony i skonfigurowany!

**Następne kroki:**
1. Poczekaj do jutra (2:00) na pierwszy automatyczny backup
2. Sprawdź logi: `tail /home/kamil/backups/gosciniec/cron.log`
3. Potwierdź utworzenie nowych plików backup

**Backupy będą tworzone codziennie o 2:00 i przechowywane przez 7 dni.**
