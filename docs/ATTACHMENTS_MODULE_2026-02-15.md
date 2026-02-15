# Moduł Załączników (Attachments)

**Data implementacji:** 15 lutego 2026  
**Branch:** `feature/attachments`  
**Status:** ✅ Kompletny

---

## Przegląd

Uniwersalny system zarządzania załącznikami (dokumenty, zdjęcia, umowy, RODO) powiązany z trzema typami encji: **Klient**, **Rezerwacja**, **Zaliczka**. System obsługuje upload via drag & drop, kategoryzację, archiwizację, wersjonowanie i batch-check statusów RODO/Umowa.

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
| `GET` | `/api/attachments?entityType=X&entityId=Y&category=Z` | Lista załączników (opcjonalny filtr kategorii) |
| `POST` | `/api/attachments` | Upload nowego załącznika (multipart/form-data) |
| `PATCH` | `/api/attachments/:id` | Aktualizacja label/description/category |
| `DELETE` | `/api/attachments/:id` | Usunięcie załącznika |
| `PATCH` | `/api/attachments/:id/archive` | Archiwizacja załącznika |
| `GET` | `/api/attachments/:id/download` | Pobranie pliku (blob) |
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
- Wyborem kategorii (pill buttons)
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

### 2. Szczegóły rezerwacji (`/reservations/[id]`)

- `AttachmentPanel` osadzony pod notatkami (lewa kolumna)
- `entityType="RESERVATION"` + `entityId={reservation.id}`

### 3. Zaliczki — Deposit Actions (`/deposits`)

- Opcja **"Załączniki"** z ikoną Paperclip w dropdown menu każdej zaliczki
- Dialog (`sm:max-w-2xl`) z `AttachmentPanel` wewnątrz
- `entityType="DEPOSIT"` + `entityId={deposit.id}`
- Nagłówek: nazwa klienta + kwota zaliczki

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

## Kategorie załączników

| Kategoria | Label PL | Kolor badge | Użycie |
|-----------|----------|-------------|--------|
| `RODO` | RODO | Violet | Zgody RODO klientów |
| `CONTRACT` | Umowa | Blue | Umowy rezerwacji |
| `INVOICE` | Faktura | Green | Faktury/rachunki |
| `PHOTO` | Zdjęcie | Amber | Zdjęcia z wydarzeń |
| `CORRESPONDENCE` | Korespondencja | Cyan | Maile, pisma |
| `OTHER` | Inne | Gray | Pozostałe dokumenty |

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
- `apps/backend/src/routes/attachments.ts` — pełne CRUD + batch endpointy
- `apps/backend/src/middleware/upload.ts` — multer config
- `apps/backend/uploads/` — katalog storage (volume Docker)

### Frontend — Nowe komponenty
- `apps/frontend/components/attachments/attachment-panel.tsx`
- `apps/frontend/components/attachments/attachment-upload-dialog.tsx`
- `apps/frontend/components/attachments/attachment-row.tsx`
- `apps/frontend/lib/api/attachments.ts`

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
