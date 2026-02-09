# Changelog - Moduł Rezerwacje

Wszystkie istotne zmiany w module Rezerwacje będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
wersjonowanie zgodnie z [Semantic Versioning](https://semver.org/lang/pl/).

---

## [Unreleased]

### 🚧 W trakcie
- Naprawa generowania PDF (problem z fontami na serwerze produkcyjnym)
- Dokumentacja API dla modułu Rezerwacje
- Podręcznik użytkownika
- Testy E2E

---

## [2.2.0] - 2026-02-09

### ✨ Added (Nowe funkcjonalności)

#### 1. Integracja z Systemem Kolejki
**Commit:** [`1c5f4b3`](https://github.com/kamil-gol/Go-ciniec_2/commit/1c5f4b3dde95ae9e38f14bc5b6c47bfee93de68f)

- ✅ Automatyczne przenoszenie rezerwacji z listy rezerwowej (RESERVED) do PENDING
- ✅ System priorytetów oparty na dacie utworzenia rezerwacji
- ✅ Automatyczne powiadomienia przy zwolnieniu terminu
- ✅ Aktualizacja statusu rezerwacji z logowaniem zmian w historii

**Pliki zmienione:**
- `apps/backend/src/services/reservation.service.ts`
- `apps/backend/src/services/queue.service.ts`

**Jak działa:**
```typescript
// Gdy rezerwacja zostaje anulowana/zakończona
// System automatycznie:
1. Szuka najbliższej rezerwacji RESERVED na ten sam termin
2. Promuje ją do statusu PENDING
3. Wysyła powiadomienie do klienta
4. Loguje zmianę w historii
```

#### 2. Rozszerzone Zarządzanie Zaliczkami
**Commit:** [`c0fb64e`](https://github.com/kamil-gol/Go-ciniec_2/commit/c0fb64e2ae70f4af5d8f84b7f3c3b56aae6c14d4)

- ✅ Nowe pole `paidAt` (DateTime) - data opłacenia zaliczki
- ✅ Nowe pole `paymentMethod` (Enum: CASH, TRANSFER, BLIK)
- ✅ Komponent `UpdateDepositStatusModal` do zarządzania statusem zaliczek
- ✅ Integracja z widokiem szczegółów rezerwacji

**Pliki zmienione:**
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/deposits/deposits.service.ts`
- `apps/frontend/components/deposits/update-deposit-status-modal.tsx`
- `apps/frontend/components/reservations/reservation-details-modal.tsx`

**Migracja bazy danych:**
```sql
ALTER TABLE "Deposit" 
  ADD COLUMN "paidAt" TIMESTAMP,
  ADD COLUMN "paymentMethod" TEXT;
```

**Przykład użycia API:**
```json
PATCH /api/deposits/:id/status
{
  "paid": true,
  "paidAt": "2026-02-09T15:30:00Z",
  "paymentMethod": "TRANSFER"
}
```

#### 3. Wsparcie dla Trzech Grup Wiekowych Gości
**Commits:** 
- Backend: [`7cbf5b3`](https://github.com/kamil-gol/Go-ciniec_2/commit/7cbf5b3742aec1c2950b2652f3f21c88db3c61e4)
- Frontend: [`4c5e38c`](https://github.com/kamil-gol/Go-ciniec_2/commit/4c5e38c8daf2ec41b8dbcaa7dbcb16e0df96cdd5)

- ✅ Nowe pole `toddlers` (Int) - dzieci 0-3 lata
- ✅ Nowe pole `pricePerToddler` (Decimal) - cena za maluchy
- ✅ Rozszerzone formularze o trzecią grupę wiekową
- ✅ Zaktualizowane kalkulacje cen
- ✅ Zaktualizowane wyświetlanie w modalach i listach

**Grupy wiekowe:**
1. 👨 **Dorośli** - pełna cena
2. 😊 **Dzieci (4-12 lat)** - cena obniżona
3. 👶 **Maluchy (0-3 lata)** - cena specjalna lub gratis

**Pliki zmienione:**
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/types/reservation.types.ts`
- `apps/backend/src/services/reservation.service.ts`
- `apps/backend/src/controllers/reservation.controller.ts`
- `apps/frontend/components/reservations/create-reservation-form.tsx`
- `apps/frontend/components/reservations/edit-reservation-modal.tsx`
- `apps/frontend/components/reservations/reservation-details-modal.tsx`

**Migracja bazy danych:**
```sql
ALTER TABLE "Reservation" 
  ADD COLUMN "toddlers" INTEGER DEFAULT 0,
  ADD COLUMN "pricePerToddler" DECIMAL(10,2) DEFAULT 0;
```

**Breaking Changes:** ⚠️
- API teraz wymaga trzech pól: `adults`, `children`, `toddlers` zamiast jednego `guests`
- Stare rezerwacje z polem `guests` nadal działają (backwards compatible)

#### 4. Struktura Dokumentacji
**Commits:** 
- [`d8bed86`](https://github.com/kamil-gol/Go-ciniec_2/commit/d8bed86f2e5afd4f91b61895a3f8bf17df00f3fe)
- [`4551809`](https://github.com/kamil-gol/Go-ciniec_2/commit/4551809cb220e2ab8cdca046aaa4ea340e0fc9f2)

- ✅ Utworzono 6 katalogów dokumentacji: `database/`, `api/`, `user-guide/`, `workflows/`, `deployment/`, `roadmap/`
- ✅ README.md w każdym katalogu z opisem zawartości
- ✅ Zaktualizowano główny indeks dokumentacji `docs/README.md`
- ✅ Mapa statusu dokumentacji dla wszystkich modułów

**Nowa struktura:**
```
docs/
├── database/        # Dokumentacja schematów BD
├── api/             # REST API endpoints
├── user-guide/      # Podręczniki użytkownika
├── workflows/       # Procesy biznesowe
├── deployment/      # Instrukcje wdrożenia
└── roadmap/         # Plany rozwoju
```

### 🔧 Changed (Zmiany)

#### 1. Ulepszenie Generowania PDF
**Commit:** [`f8c8322`](https://github.com/kamil-gol/Go-ciniec_2/commit/f8c8322fd89c2904356b3a09dd63a4d56ac96b9f)

- 🔄 Dodano system fallback dla fontów (DejaVu → Helvetica)
- 🔄 Automatyczne sprawdzanie dostępności fontów przed użyciem
- 🔄 Lepsze logowanie błędów dla debugowania
- 🔄 Obsługa przypadków gdy fonty nie są zainstalowane
- 🔄 Usunięto znaki specjalne Unicode (zamieniono na ASCII)

**Problem:**
- PDF generowały się, ale nie mogły być pobrane przez przeglądarkę
- Fonty DejaVu nie były dostępne na serwerze

**Rozwiązanie:**
- System próbuje użyć fontów DejaVu z wielu lokalizacji
- Jeśli nie znajdzie, używa wbudowanych fontów Helvetica
- Szczegółowe logi pomagają w diagnozie

**Status:** ⚠️ Częściowo rozwiązane, wymaga dalszej diagnozy na serwerze produkcyjnym

**Pliki zmienione:**
- `apps/backend/src/services/pdf.service.ts`

**Instalacja fontów na serwerze:**
```bash
sudo apt-get update
sudo apt-get install fonts-dejavu-core fonts-dejavu-extra
pm2 restart backend
```

### 🐛 Fixed (Naprawione błędy)

#### 1. Kompatybilność Typów Wydarzeń
**Commit:** [`da4eab6`](https://github.com/kamil-gol/Go-ciniec_2/commit/da4eab6de6f01edf75da4f5d8e1a6e4d03f2ed05)

- ✅ Naprawiono obsługę "Rocznica" vs "Rocznica/Jubileusz"
- ✅ System akceptuje oba warianty nazewnictwa
- ✅ Poprawione wyświetlanie pól specjalnych dla rocznic

**Problem:**
- Niektóre rezerwacje używały "Rocznica", inne "Rocznica/Jubileusz"
- Pola `anniversaryYear` i `anniversaryOccasion` nie pokazywały się dla jednej z wersji

**Rozwiązanie:**
```typescript
const isAnniversary = 
  reservation.eventType?.name === 'Rocznica' || 
  reservation.eventType?.name === 'Rocznica/Jubileusz'
```

**Pliki zmienione:**
- `apps/frontend/components/reservations/reservation-details-modal.tsx`
- `apps/frontend/components/reservations/create-reservation-form.tsx`

#### 2. Problem z Line Endings i Emoji w Kodzie
**Commit:** [`79f63e2`](https://github.com/kamil-gol/Go-ciniec_2/commit/79f63e25685e652ff3555451357c4a5f235e7a20)

- ✅ Zmieniono line endings z CRLF (Windows) na LF (Unix)
- ✅ Usunięto emoji ✨ z komentarzy w kodzie
- ✅ Naprawiono problem z parserem SWC

**Problem:**
```
SyntaxError: Unexpected token in edit-reservation-modal.tsx
× Expression expected
```

**Przyczyna:**
- Parser SWC miał problem z CRLF line endings
- Emoji w komentarzach powodowały błędy parsowania

**Rozwiązanie:**
- Konwersja wszystkich plików na LF
- Usunięcie emoji z komentarzy kodu
- Dodanie `.gitattributes` aby wymusić LF

**Pliki zmienione:**
- `apps/frontend/components/reservations/edit-reservation-modal.tsx`

---

## 📊 Statystyki Zmian

### Dzisiejsza sesja (09.02.2026):
- **Commits:** 8
- **Plików zmienionych:** 15+
- **Dodane linie:** ~1,500
- **Usunięte linie:** ~300
- **Nowe funkcjonalności:** 4
- **Naprawione błędy:** 2
- **Ulepszenia:** 1

### Moduł Rezerwacje - Status Ogólny:
- **Kompletność:** ~95% ✅
- **Testy:** ~60% 🔄
- **Dokumentacja:** ~40% 🔄

---

## 🔗 Powiązane Dokumenty

- [📖 README.md](./README.md) - Główny dokument projektu
- [📚 docs/README.md](./docs/README.md) - Indeks dokumentacji
- [📋 QUEUE.md](./docs/QUEUE.md) - Dokumentacja systemu kolejki
- [🗄️ DATABASE.md](./docs/DATABASE.md) - Schemat bazy danych
- [🏗️ ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architektura systemu

### Dokumentacja Modułu Rezerwacje:
- [🗄️ docs/database/](./docs/database/) - Schematy bazy danych
- [🔌 docs/api/](./docs/api/) - Dokumentacja API
- [👥 docs/user-guide/](./docs/user-guide/) - Podręczniki użytkownika
- [🔄 docs/workflows/](./docs/workflows/) - Procesy biznesowe
- [🚀 docs/deployment/](./docs/deployment/) - Instrukcje wdrożenia
- [🗺️ docs/roadmap/](./docs/roadmap/) - Plany rozwoju

---

## 🚀 Migracje i Deployment

### Wymagane migracje bazy danych:

```bash
cd apps/backend
npx prisma migrate deploy
```

### Restart serwisów:

```bash
pm2 restart backend
pm2 restart frontend
```

### Instalacja fontów (opcjonalnie dla PDF):

```bash
sudo apt-get update
sudo apt-get install fonts-dejavu-core fonts-dejavu-extra
pm2 restart backend
```

---

## ⚠️ Breaking Changes

### v2.2.0 (2026-02-09)

#### API Rezerwacji - Grupy Wiekowe
**Wpływ:** Backend API, Frontend Forms

**Przed:**
```json
{
  "guests": 50
}
```

**Teraz:**
```json
{
  "adults": 30,
  "children": 15,
  "toddlers": 5
}
```

**Backwards Compatibility:** ✅ Stare rezerwacje nadal działają

**Akcje wymagane:**
- Frontend: Zaktualizować formularze do używania trzech pól
- API Clients: Dodać obsługę nowych pól
- Testy: Zaktualizować test fixtures

---

## 🐛 Znane Problemy

### 1. Generowanie PDF - Status: 🔄 W TRAKCIE
**Priorytet:** Wysoki  
**Zgłoszony:** 2026-02-09

**Opis:**
- PDF generują się, ale nie pobierają się w przeglądarce
- Prawdopodobnie problem z fontami na serwerze produkcyjnym

**Obejście:**
- System używa fontów fallback (Helvetica)
- Brak polskich znaków w fallback mode

**Plan naprawy:**
1. Zainstalować fonty DejaVu na serwerze
2. Zrestartować backend
3. Przetestować generowanie PDF
4. Jeśli problem dalej występuje - szczegółowa analiza logów

**Tracking:** Link do issue (do utworzenia)

---

## 📅 Historia Wersji

### [2.2.0] - 2026-02-09
- Integracja z systemem kolejki
- Rozszerzone zarządzanie zaliczkami  
- Wsparcie dla trzech grup wiekowych
- Struktura dokumentacji
- Naprawa kompatybilności typów wydarzeń
- Naprawa line endings i emoji
- Ulepszenie generowania PDF

### [2.1.0] - 2026-02-08
- Podstawowy moduł rezerwacji
- System statusów
- Integracja z klientami
- Podstawowe formularze

### [2.0.0] - 2026-02-01
- Pierwsza stabilna wersja modułu Rezerwacje
- REST API
- CRUD operations
- Podstawowa walidacja

---

## 👥 Współtwórcy

- **Kamil Gołębiowski** - Główny developer
- **Perplexity AI** - Asystent programowania

---

## 📝 Format Changelog

Ten changelog używa formatu [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

### Kategorie zmian:
- **Added** - Nowe funkcjonalności
- **Changed** - Zmiany w istniejących funkcjonalnościach
- **Deprecated** - Funkcjonalności oznaczone do usunięcia
- **Removed** - Usunięte funkcjonalności
- **Fixed** - Naprawione błędy
- **Security** - Poprawki bezpieczeństwa

### Ikony statusu:
- ✅ Ukończone
- 🔄 W trakcie
- ⏳ Planowane
- ⚠️ Wymaga uwagi
- ❌ Anulowane
- ✨ Nowe

---

**Ostatnia aktualizacja:** 09.02.2026 - 17:00 CET  
**Wersja dokumentu:** 1.0  
**Autor:** Kamil Gołębiowski
