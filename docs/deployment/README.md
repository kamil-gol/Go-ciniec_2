# 🚀 Deployment Documentation

Dokumentacja wdrożenia i konfiguracji systemu.

## 📋 Zawartość

- `RESERVATIONS_DEPLOYMENT.md` - Wdrożenie modułu Rezerwacje
- `ENVIRONMENT_SETUP.md` - Konfiguracja środowiska
- `DATABASE_MIGRATIONS.md` - Uruchamianie migracji
- `TROUBLESHOOTING.md` - Rozwiązywanie problemów

## 🔧 Wymagania systemowe

### Backend
- Node.js 18+
- PostgreSQL 14+
- PM2 (process manager)

### Frontend
- Node.js 18+
- Next.js 14+

### Dodatkowe
- Fonty DejaVu (dla generowania PDF)
- Nginx (jako reverse proxy)

## 🚀 Szybkie wdrożenie

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/kamil-gol/Go-ciniec_2.git

# 2. Zainstaluj zależności
cd Go-ciniec_2
npm install

# 3. Skonfiguruj zmienne środowiskowe
cp .env.example .env

# 4. Uruchom migracje
cd apps/backend
npx prisma migrate deploy

# 5. Uruchom aplikację
pm2 start ecosystem.config.js
```

## 📚 Szczegóły

Przeczytaj szczegółową dokumentację w odpowiednich plikach.