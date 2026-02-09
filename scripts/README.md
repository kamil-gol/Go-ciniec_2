# 📦 Skrypty Projektu Gościniec_2

## 📚 Spis Skryptów

### 💾 Backup & Restore

#### `backup.sh`
**Funkcja:** Tworzy pełny backup systemu (baza danych + pliki aplikacji)

**Użycie:**
```bash
source .env.backup
./scripts/backup.sh
```

**Co robi:**
- Tworzy dump bazy danych PostgreSQL
- Kompresuje pliki aplikacji
- Usuwa stare backupy zgodnie z RETENTION_DAYS
- Zapisuje w katalogu określonym w BACKUP_DIR

**Dokumentacja:** [`docs/BACKUP.md`](../docs/BACKUP.md)

---

#### `restore.sh`
**Funkcja:** Przywraca system z backupu

**Użycie:**
```bash
source .env.backup
./scripts/restore.sh backup-2026-02-09_10-15-32.sql.gz
```

**Co robi:**
- Zatrzymuje kontenery Docker
- Przywraca bazę danych z podanego backupu
- Uruchamia ponownie kontenery
- Weryfikuje poprawność przywracania

**Dokumentacja:** [`docs/BACKUP.md`](../docs/BACKUP.md)

---

### 🧪 Testowanie

#### `test-api.sh`
**Funkcja:** Testuje endpointy API backendu

**Użycie:**
```bash
./scripts/test-api.sh
```

**Co testuje:**
- Health check
- CRUD operacje na rezerwacjach
- Zarządzanie salą
- System kolejek

---

## ⚙️ Konfiguracja

### Plik `.env.backup`

Wszystkie skrypty backup/restore wymagają pliku konfiguracyjnego:

```bash
# Stwórz konfigurację z przykładu
cp .env.backup.example .env.backup

# Edytuj wartości
nano .env.backup

# Zabezpiecz plik (ważne - zawiera hasła!)
chmod 600 .env.backup
```

**UWAGA:** Plik `.env.backup` jest ignorowany przez git - NIE commituj go!

---

## 🔒 Uprawnienia

Upewnij się, że skrypty mają uprawnienia wykonywania:

```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
chmod +x scripts/test-api.sh
```

---

## ⏰ Automatyzacja (Cron)

Dodaj backup do crona (codziennie o 2:00):

```bash
crontab -e
```

Dodaj linię:
```
0 2 * * * cd /home/kamil/rezerwacje && source .env.backup && ./scripts/backup.sh >> /home/kamil/backups/gosciniec/cron.log 2>&1
```

---

## 📝 Dokumentacja

### Pełna dokumentacja systemu backupów:
- **Dokumentacja techniczna:** [`docs/BACKUP.md`](../docs/BACKUP.md)
- **Instrukcje wdrożenia:** [`docs/DEPLOYMENT_BACKUP.md`](../docs/DEPLOYMENT_BACKUP.md)

### Inne dokumenty:
- **Architektura:** [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- **Baza danych:** [`docs/DATABASE.md`](../docs/DATABASE.md)
- **Deployment:** [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)

---

## 🔧 Rozwiazywanie Problemów

### Skrypt nie ma uprawnień
```bash
chmod +x scripts/*.sh
```

### Błąd połączenia z Docker
```bash
# Sprawdź czy kontenery działają
docker ps

# Sprawdź nazwę kontenera DB
docker ps --format "{{.Names}}"

# Zaktualizuj DB_CONTAINER w .env.backup
```

### Brak miejsca na dysku
```bash
# Sprawdź miejsce
df -h

# Zmniejsz RETENTION_DAYS w .env.backup
# lub usuń stare backupy ręcznie
```

---

## ✅ Quick Start

```bash
# 1. Sklonuj/pobierz repo
git pull origin main

# 2. Przygotuj konfigurację
cp .env.backup.example .env.backup
nano .env.backup  # Ustaw hasło!
chmod 600 .env.backup

# 3. Ustaw uprawnienia
chmod +x scripts/*.sh

# 4. Test backupu
source .env.backup
./scripts/backup.sh

# 5. Sprawdź wynik
ls -lh /home/kamil/backups/gosciniec/
```

---

## 📞 Kontakt

W razie problemów, sprawdź dokumentację lub logi:
- Logi cron: `/home/kamil/backups/gosciniec/cron.log`
- Logi Docker: `docker logs <nazwa_kontenera>`
