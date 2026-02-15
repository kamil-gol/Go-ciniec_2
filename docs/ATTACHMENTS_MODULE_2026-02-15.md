# Moduł Załączników (Attachments)

**Data implementacji:** 15 lutego 2026  
**Branch:** `feature/attachments` → zmergowany do `main`  
**Status:** ✅ Kompletny

---

## Przegląd

Uniwersalny system zarządzania załącznikami (dokumenty, zdjęcia, umowy, RODO) powiązany z trzema typami encji: **Klient**, **Rezerwacja**, **Zaliczka**. System obsługuje upload via drag & drop, kategoryzację, archiwizację, wersjonowanie, batch-check statusów RODO/Umowa oraz **automatyczny RODO redirect** — RODO wgrane z dowolnego modułu jest zawsze przypisywane do klienta.

---

## RODO Redirect (kluczowa funkcjonalność)

### Problem

RDO jest logicznie powiązane z **osobą klienta**, nie z konkretną rezerwacją czy zaliczką. Gdy użytkownik wgrywał RODO z poziomu rezerwacji, załącznik był zapisywany jako `entityType=RESERVATION` — nie był widoczny w module klienta, a badge RODO na listach nie działał poprawnie.

### Rozwiązanie

Backend automatycznie przekierowuje RODO do klienta:

```
Upload RODO z rezerwacji:
  entityType=RESERVATION, entityId=resId, category=RODO
  ↓ backend resolve: reservation.clientId
  ↓ zapis jako: entityType=CLIENT, entityId=clientId
  ↓ plik trafia do: uploads/clients/

Upload RODO z zaliczki:
  entityType=DEPOSIT, entityId=depId, category=RODO
  ↓ backend resolve: deposit → reservation → clientId
  ↓ zapis jako: entityType=CLIENT, entityId=clientId
  ↓ plik trafia do: uploads/clients/
```

### Wyświetlanie cross-reference

Gdy `AttachmentPanel` jest osadzony w rezerwacji lub zaliczce:
1. Frontend wysyła request z parametrem `?withClientRodo=true`
2. Backend zwraca własne załączniki encji + RODO z profilu klienta (z flagą `_fromClient: true`)
3. Panel wyświetla RODO z etykietą **„Z profilu klienta"** (ikona User, kolor teal)

### Efekt

| Akcja | Widoczne w kliencie | Widoczne w rezerwacji | Badge RODO |
|-------|--------------------|-----------------------|------------|
| RODO wgrane w kliencie | ✅ | ✅ (cross-ref) | ✅ |
| RODO wgrane w rezerwacji | ✅ (redirect) | ✅ (cross-ref) | ✅ |
| RODO wgrane w zaliczce | ✅ (redirect) | ✅ (cross-ref) | ✅ |

---

## Model danych (Prisma)

```prisma
model Attachment {
  id            String             @id @default(uuid())
  entityType    AttachmentEntity               // CLIENT | RESERVATION | DEPOSIT
  entityId      String
  category      AttachmentCategory             // RODO | CONTRACT | INVOICE | PHOTO | CORRESPONDENCE | OTHER
  label         String?
  originalName  String
  storedName    String             @unique
  mimeType      String
  sizeBytes     Int
  storagePath   String
  uploadedById  String
  uploadedBy    User               @relation(fields: [uploadedById], references: [id])
  description   String?
  isArchived    Boolean            @default(false)
  version       Int                @default(1)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([entityType, entityId])
  @@index([category])
}
```

---

## Endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/attachments?entityType=X&entityId=Y&category=Z&withClientRodo=true` | Lista załączników (opcjonalny filtr kategorii + cross-ref RODO) |
| `POST` | `/api/attachments` | Upload nowego załącznika (multipart/form-data) — **RODO redirect automatyczny** |
| `PATCH` | `/api/attachments/:id` | Aktualizacja label/description/category |
| `DELETE` | `/api/attachments/:id` | Usunięcie załącznika (soft-delete → archiwizacja) |
| `PATCH` | `/api/attachments/:id/archive` | Archiwizacja załącznika |
| `GET` | `/api/attachments/:id/download` | Pobranie pliku (blob) |
| `GET` | `/api/attachments/check?entityType&entityId&category` | Sprawdzenie czy encja ma daną kategorię |
| `POST` | `/api/attachments/batch-check-rodo` | Batch: sprawdzenie RODO dla listy clientIds |
| `POST` | `/api/attachments/batch-check-contract` | Batch: sprawdzenie umowy dla listy reservationIds |

### Upload (POST /api/attachments)

**Content-Type:** `multipart/form-data`

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `file` | File | ✅ | Plik do uploadu |
| `entityType` | string | ✅ | `CLIENT` / `RESERVATION` / `DEPOSIT` |
| `entityId` | string | ✅ | UUID encji |
| `category` | string | ✅ | Kategoria załącznika |
| `label` | string | ❌ | Etykieta (domyślnie: nazwa pliku) |
| `description` | string | ❌ | Opis załącznika |

> **Uwaga:** Gdy `category=RODO` i `entityType` to `RESERVATION` lub `DEPOSIT`, backend automatycznie resolwuje `clientId` i zapisuje załącznik jako `entityType=CLIENT`. Plik trafia do `uploads/clients/`.

### GET z cross-reference RODO

```
GET /api/attachments?entityType=RESERVATION&entityId=uuid&withClientRodo=true
```

Zwraca załączniki rezerwacji **+ RODO z powiązanego klienta** (z flagą `_fromClient: true`).

### Batch Check RODO (POST /api/attachments/batch-check-rodo)

```json
// Request
{ "clientIds": ["uuid-1", "uuid-2"] }

// Response
{ "data": { "uuid-1": true, "uuid-2": false } }
```

### Batch Check Contract (POST /api/attachments/batch-check-contract)

```json
// Request
{ "reservationIds": ["uuid-1", "uuid-2"] }

// Response
{ "data": { "uuid-1": true, "uuid-2": false } }
```

---

## Walidacja plików (client-side)

| Parametr | Wartość |
|----------|---------|
| Dozwolone typy MIME | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| Dozwolone rozszerzenia | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp` |
| Max rozmiar pliku | **10 MB** |
| Walidacja | Przed uploadem — toast z komunikatem błędu |
| Obsługa | Kliknięcie + drag & drop |

---

## Komponenty Frontend

### AttachmentPanel

**Ścieżka:** `components/attachments/attachment-panel.tsx`

Uniwersalny panel wyświetlający listę załączników z:
- Filtrowaniem po kategoriach (badge'y)
- Licznikiem plików per kategoria
- Przyciskiem "Wgraj załącznik"
- Przełącznikiem archiwum
- Responsywnym układem
- **Cross-reference RODO** — dla RESERVATION/DEPOSIT automatycznie pobiera RODO klienta z etykietą "Z profilu klienta"

**Props:**
```tsx
interface AttachmentPanelProps {
  entityType: EntityType       // 'CLIENT' | 'RESERVATION' | 'DEPOSIT'
  entityId: string             // UUID encji
  title?: string               // Nagłówek panelu (domyślnie: "Załączniki")
  className?: string           // Dodatkowe klasy CSS
}
```

### AttachmentUploadDialog

**Ścieżka:** `components/attachments/attachment-upload-dialog.tsx`

Dialog z:
- Drop zone (drag & drop)
- Walidacją MIME type i rozmiaru
- Wyborem kategorii (pill buttons) — **RODO dostępne we wszystkich modułach**
- Polami label i description (opcjonalne)
- Stanem uploadu z loaderem

### AttachmentRow

**Ścieżka:** `components/attachments/attachment-row.tsx`

Pojedynczy wiersz załącznika z:
- Ikoną MIME type (PDF/obraz/inne)
- Badge kategorii
- Info o uploaderze i dacie
- Rozmiar pliku
- Dropdown menu: pobierz / edytuj / archiwizuj / usuń

---

## Integracje w modułach

### 1. Szczegóły klienta (`/clients/[id]`)

- `AttachmentPanel` osadzony pod sekcją kontaktów
- `entityType="CLIENT"` + `entityId={client.id}`
- RODO wgrane z rezerwacji/zaliczki jest tu widoczne

### 2. Szczegóły rezerwacji (`/reservations/[id]`)

- `AttachmentPanel` osadzony pod notatkami (lewa kolumna)
- `entityType="RESERVATION"` + `entityId={reservation.id}`
- RODO z profilu klienta widoczne z etykietą "Z profilu klienta"
- Wgranie RODO tutaj → automatycznie trafia do klienta

### 3. Zaliczki — Deposit Actions (`/deposits`)

- Opcja **"Załączniki"** z ikoną Paperclip w dropdown menu każdej zaliczki
- Dialog (`sm:max-w-2xl`) z `AttachmentPanel` wewnątrz
- `entityType="DEPOSIT"` + `entityId={deposit.id}`
- Nagłówek: nazwa klienta + kwota zaliczki
- Wgranie RODO tutaj → automatycznie trafia do klienta

### 4. Lista rezerwacji — Badge RODO

- Komponent `RodoBadge` w headerze karty rezerwacji
- Teal `ShieldCheck` → RODO jest / pomarańczowy `ShieldAlert` → brak RODO
- Dane z `batchCheckRodo(clientIds)` — unikalne `clientId` z widocznych rezerwacji

### 5. Lista rezerwacji — Badge Umowy

- Komponent `ContractBadge` w headerze karty rezerwacji
- Niebieski `FileCheck` → umowa jest / szary `FileX` → brak umowy
- Dane z `batchCheckContract(reservationIds)`

### 6. Lista klientów — Badge RODO

- Badge RODO na kartach klientów
- Dane z `batchCheckRodo(clientIds)`

---

## Kategorie załączników per moduł

### CLIENT
| Kategoria | Label PL | Opis |
|-----------|----------|------|
| `RODO` | Zgoda RODO | Podpisana zgoda na przetwarzanie danych |
| `CORRESPONDENCE` | Korespondencja | Skany ustaleń mailowych, SMS, screenshots |
| `OTHER` | Inne | Inne dokumenty klienta |

### RESERVATION
| Kategoria | Label PL | Opis |
|-----------|----------|------|
| `RODO` | Zgoda RODO | **→ automatycznie przypisana do klienta** |
| `CONTRACT` | Umowa | Podpisana umowa rezerwacji |
| `ANNEX` | Aneks | Aneks do umowy (zmiana warunków) |
| `POST_EVENT` | Dokumentacja powykonawcza | Protokół zdania sali, zdjęcia |
| `OTHER` | Inne | Inne dokumenty rezerwacji |

### DEPOSIT
| Kategoria | Label PL | Opis |
|-----------|----------|------|
| `RODO` | Zgoda RODO | **→ automatycznie przypisana do klienta** |
| `PAYMENT_PROOF` | Potwierdzenie przelewu | Skan/screenshot operacji bankowej |
| `INVOICE` | Faktura zaliczkowa | Faktura VAT za wpłaconą zaliczkę |
| `REFUND_PROOF` | Potwierdzenie zwrotu | Dokument potwierdzający zwrot |
| `OTHER` | Inne | Inne dokumenty zaliczki |

---

## Bugfixy w tej sesji

### Fix: "Wydano" w szczegółach klienta

**Problem:** `totalPrice` z Prisma Decimal przychodził jako string (np. `"18000"`). Operator `+` robił konkatenację: `0 + "18000"` → `"018000"`.  
**Fix:** `Number(r.totalPrice) || 0` w `reduce()` i w wyświetlaniu per rezerwacja.  
**Plik:** `apps/frontend/app/dashboard/clients/[id]/page.tsx`

---

## Pliki zmienione/dodane

### Backend
- `apps/backend/prisma/schema.prisma` — model Attachment + enum
- `apps/backend/src/constants/attachmentCategories.ts` — kategorie per entityType, MIME types, limity
- `apps/backend/src/services/attachment.service.ts` — CRUD + RODO redirect + cross-reference + batch check
- `apps/backend/src/controllers/attachment.controller.ts` — HTTP handlers + `withClientRodo` query param
- `apps/backend/src/routes/attachment.routes.ts` — REST endpoints
- `apps/backend/src/middlewares/upload.ts` — multer config (UUID nazwy, walidacja MIME, 10MB)
- `apps/backend/src/types/attachment.types.ts` — DTO, filtry, response types
- `apps/backend/uploads/` — katalog storage (volume Docker)

### Frontend — Nowe komponenty
- `apps/frontend/components/attachments/attachment-panel.tsx` — panel z cross-ref RODO
- `apps/frontend/components/attachments/attachment-upload-dialog.tsx` — drag & drop upload
- `apps/frontend/components/attachments/attachment-row.tsx` — wiersz załącznika
- `apps/frontend/lib/api/attachments.ts` — API client z `withClientRodo` param

### Frontend — Zmodyfikowane
- `apps/frontend/app/dashboard/clients/[id]/page.tsx` — AttachmentPanel + fix Wydano
- `apps/frontend/app/dashboard/reservations/[id]/page.tsx` — AttachmentPanel
- `apps/frontend/components/deposits/deposit-actions.tsx` — dialog Załączniki
- `apps/frontend/components/reservations/reservations-list.tsx` — RodoBadge + ContractBadge

---

## Kolejność badge'y na liście rezerwacji

```
[RODO] [Umowa] [Zaliczka] [Status]
```

Każdy badge jest niezależny i ładowany via batch API przy zmianie strony/filtra.

---

## Architektura RODO redirect (schemat)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend: Upload RODO z rezerwacji                     │
│  POST /api/attachments                                  │
│  { entityType: RESERVATION, entityId: resId,            │
│    category: RODO, file: ... }                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: createAttachment()                            │
│  1. Walidacja entityType + category ✓                   │
│  2. Walidacja entity exists ✓                           │
│  3. Wykrycie: category=RODO && entityType≠CLIENT        │
│  4. resolveClientId(RESERVATION, resId)                 │
│     → reservation.clientId                              │
│  5. Zmiana: entityType=CLIENT, entityId=clientId        │
│  6. moveToEntityDir → uploads/clients/                  │
│  7. Zapis w DB jako CLIENT attachment                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Rezultat:                                              │
│  • Widoczne w /clients/[id] ✅                          │
│  • Widoczne w /reservations/[id] (cross-ref) ✅         │
│  • Badge RODO na listach ✅                             │
│  • batchCheckRodo → szuka CLIENT attachments ✅          │
└─────────────────────────────────────────────────────────┘
```
