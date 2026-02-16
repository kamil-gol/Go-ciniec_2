# Moduł Załączników (Attachments)

**Data rozpoczęcia:** 15 lutego 2026  
**Data zakończenia:** 16 lutego 2026  
**Branch:** `feature/55-attachments-frontend` (PR #71) → zmergowany do `main`  
**Status:** ✅ Kompletny (Fazy 1-5)

---

## Przegląd

Uniwersalny system zarządzania załącznikami (dokumenty, zdjęcia, umowy, RODO) powiązany z trzema typami encji: **Klient**, **Rezerwacja**, **Zaliczka**. System obsługuje upload via drag & drop, kategoryzację, archiwizację, wersjonowanie, batch-check statusów RODO/Umowa oraz **automatyczny RODO redirect** — RODO wgrane z dowolnego modułu jest zawsze przypisywane do klienta.

### Funkcjonalności

- ✅ **Phase 1 — Backend API** (15.02.2026)
  - 8 REST endpoints (upload, list, download, archive, batch-check)
  - RODO redirect logic
  - Polymorphic entity support
  - Multer file upload
  - Category validation

- ✅ **Phase 2 — Frontend Components** (16.02.2026)
  - TanStack Query hooks (`useAttachments`, mutations)
  - AttachmentPanel with filters
  - AttachmentUploadDialog (drag & drop)
  - AttachmentPreview modal (PDF iframe, image zoom/rotate)
  - AttachmentRow with action menu

- ✅ **Phase 3 — Sheet Integration** (16.02.2026)
  - Client detail view integration
  - Reservation detail view integration
  - Deposit sheet integration

- ✅ **Phase 4 — Badges** (16.02.2026)
  - RODO badge on client/reservation lists
  - Contract badge on reservation list
  - Deposit status badge
  - Batch-check hooks for efficient loading

- ✅ **Phase 5 — Testing** (16.02.2026)
  - Jest + ts-jest setup
  - 38 unit tests for AttachmentService
  - Coverage: CRUD, RODO redirect, batch checks, file ops

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

## Phase 2: Frontend Components 🆕

### TanStack Query Hooks

**Ścieżka:** `hooks/use-attachments.ts`

Zentralizowane hooki React Query dla zarządzania załącznikami:

```typescript
// Query factory
export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (entityType: EntityType, entityId: string, category?: string) => 
    [...attachmentKeys.lists(), { entityType, entityId, category }] as const,
}

// Lista załączników
const { data, isLoading } = useAttachments(entityType, entityId, category?)

// Mutations z auto-invalidation
const upload = useUploadAttachment()
const update = useUpdateAttachment()
const archive = useArchiveAttachment()
const del = useDeleteAttachment()

// Batch checks
const { data: rodoMap } = useBatchCheckRodo(clientIds)
const { data: contractMap } = useBatchCheckContract(reservationIds)
```

**Zalety:**
- Automatyczne cache'owanie
- Optimistic updates
- Background refetch
- Eliminacja `useState` + `useEffect` + `useCallback` boilerplate
- Centralna invalidacja cache po mutacjach

### AttachmentPanel

**Ścieżka:** `components/attachments/attachment-panel.tsx`

Uniwersalny panel z filtrowaniem, licznikami, przyciskami akcji.

**Props:**
```tsx
interface AttachmentPanelProps {
  entityType: EntityType       // 'CLIENT' | 'RESERVATION' | 'DEPOSIT'
  entityId: string             // UUID encji
  title?: string               // Nagłówek panelu (domyślnie: "Załączniki")
  className?: string           // Dodatkowe klasy CSS
}
```

**Funkcje:**
- ✅ Lista załączników z `useAttachments()`
- ✅ Filtry kategorii (badge buttons) — **dynamiczne per entityType**
- ✅ Licznik plików per kategoria
- ✅ Przycisk "Wgraj załącznik" → `AttachmentUploadDialog`
- ✅ Cross-reference RODO (dla RESERVATION/DEPOSIT)
- ✅ Przełącznik archiwum
- ✅ Responsywny layout

**Dynamiczne kategorie:**
```typescript
import { getCategoriesForEntity } from '@/lib/api/attachments'

const categories = getCategoriesForEntity(entityType)
// CLIENT → [RODO, CORRESPONDENCE, OTHER]
// RESERVATION → [RODO, CONTRACT, ANNEX, POST_EVENT, OTHER]
// DEPOSIT → [RODO, PAYMENT_PROOF, INVOICE, REFUND_PROOF, OTHER]
```

### AttachmentUploadDialog 🆕

**Ścieżka:** `components/attachments/attachment-upload-dialog.tsx`

Dialog z drag & drop, walidacją, kategoriami.

**Props:**
```tsx
interface AttachmentUploadDialogProps {
  entityType: EntityType
  entityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
```

**Funkcje:**
- ✅ Drop zone (click + drag & drop)
- ✅ Walidacja MIME type przed uploadem
- ✅ Walidacja rozmiaru (10 MB limit)
- ✅ **Dynamiczne kategorie** z `getCategoriesForEntity()`
- ✅ Pill buttons do wyboru kategorii
- ✅ Label i description (opcjonalne)
- ✅ Upload progress z loader
- ✅ Toast success/error
- ✅ Auto-refetch po sukcesie (query invalidation)

**Walidacja:**
```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
```

### AttachmentPreview 🆕

**Ścieżka:** `components/attachments/attachment-preview.tsx`

**Modal podglądu załącznika w aplikacji** — bez otwierania w nowej karcie.

**Props:**
```tsx
interface AttachmentPreviewProps {
  attachment: Attachment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Funkcje:**
- ✅ **PDF:** Iframe z blob URL (natywny podgląd przeglądarki)
- ✅ **Obrazy:** `<img>` z zoom (hover: scale 150%) + rotacja (przyciski 90°)
- ✅ **Blob fetch:** Download z `/api/attachments/:id/download`
- ✅ **Cleanup:** `URL.revokeObjectURL()` w `useEffect` cleanup
- ✅ **Przycisk pobierania:** Download w nowej karcie
- ✅ **Loading state:** Skeleton podczas pobierania blob
- ✅ **Error handling:** Komunikat + fallback do window.open

**Implementacja zoom:**
```tsx
<div className="group relative overflow-auto">
  <img 
    src={blobUrl} 
    className="w-full transition-transform group-hover:scale-150"
    style={{ transformOrigin: 'center' }}
  />
</div>
```

**Rotacja:**
```tsx
const [rotation, setRotation] = useState(0)

<img 
  style={{ transform: `rotate(${rotation}deg)` }}
/>

<Button onClick={() => setRotation(r => r + 90)}>
  <RotateCw /> Obróć
</Button>
```

**Backward compatible:** `AttachmentRow` ma prop `onPreview?` — jeśli nie podany, fallback na `window.open()`.

### AttachmentRow

**Ścieżka:** `components/attachments/attachment-row.tsx`

Pojedynczy wiersz załącznika z ikoną, badge, menu.

**Props:**
```tsx
interface AttachmentRowProps {
  attachment: Attachment
  onUpdate?: () => void
  onDelete?: () => void
  onPreview?: (attachment: Attachment) => void  // 🆕 opcjonalny preview callback
}
```

**Funkcje:**
- ✅ Ikona MIME type (`FileText`, `Image`, `File`)
- ✅ Badge kategorii z kolorem (np. RODO → teal, CONTRACT → blue)
- ✅ **Nowe kolory badge'ów:**
  - `ANNEX` → purple
  - `POST_EVENT` → orange
  - `PAYMENT_PROOF` → green
  - `REFUND_PROOF` → yellow
- ✅ Info uploader + data
- ✅ Rozmiar pliku (formatowany)
- ✅ Dropdown menu: **Podgląd** / Pobierz / Edytuj / Archiwizuj / Usuń
- ✅ "Z profilu klienta" tag (dla cross-ref RODO)

**Preview integration:**
```tsx
<DropdownMenuItem onClick={() => 
  onPreview ? onPreview(attachment) : window.open(downloadUrl)
}>
  <Eye className="h-4 w-4" /> Podgląd
</DropdownMenuItem>
```

---

## Phase 3: Sheet Integration 🆕

### 1. Client Detail View

**Plik:** `app/dashboard/clients/[id]/page.tsx`

```tsx
<AttachmentPanel 
  entityType="CLIENT" 
  entityId={client.id}
  title="Załączniki klienta"
/>
```

**Lokalizacja:** Pod sekcją kontaktów, w głównej kolumnie  
**Cross-ref:** Nie ma (to źródło RODO)  
**Kategorie:** RODO, Korespondencja, Inne

### 2. Reservation Detail View

**Plik:** `app/dashboard/reservations/[id]/page.tsx`

```tsx
<AttachmentPanel 
  entityType="RESERVATION" 
  entityId={reservation.id}
  title="Załączniki rezerwacji"
/>
```

**Lokalizacja:** Lewa kolumna, pod notatkami  
**Cross-ref:** RODO z profilu klienta widoczne z tagiem "Z profilu klienta"  
**Kategorie:** RODO (→ redirect), Umowa, Aneks, Dok. powykonawcza, Inne

### 3. Deposit Sheet Dialog

**Plik:** `components/deposits/deposit-actions.tsx`

```tsx
<DropdownMenuItem onClick={handleOpenAttachments}>
  <Paperclip /> Załączniki
</DropdownMenuItem>

<Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>
        {deposit.reservation.client.firstName} {deposit.reservation.client.lastName} — 
        {formatCurrency(deposit.amount)}
      </DialogTitle>
    </DialogHeader>
    <AttachmentPanel 
      entityType="DEPOSIT" 
      entityId={deposit.id}
    />
  </DialogContent>
</Dialog>
```

**Lokalizacja:** Dialog z dropdown menu zaliczki (lista zaliczek)  
**Cross-ref:** RODO z profilu klienta widoczne  
**Kategorie:** RODO (→ redirect), Potw. przelewu, Faktura, Potw. zwrotu, Inne

---

## Phase 4: Badges 🆕

### RODO Badge — Lista Klientów

**Plik:** `components/clients/clients-list.tsx`

```tsx
import { useBatchCheckRodo } from '@/hooks/use-attachments'

const clientIds = clients.map(c => c.id)
const { data: rodoMap } = useBatchCheckRodo(clientIds)

{rodoMap?.[client.id] ? (
  <Badge variant="outline" className="text-teal-600 border-teal-600">
    <ShieldCheck className="h-3 w-3" /> RODO
  </Badge>
) : (
  <Badge variant="outline" className="text-orange-500 border-orange-500">
    <ShieldAlert className="h-3 w-3" /> Brak RODO
  </Badge>
)}
```

**Efektywność:** Jeden request dla wszystkich klientów na stronie (batch API)

### RODO Badge — Lista Rezerwacji

**Plik:** `components/reservations/reservations-list.tsx`

```tsx
const clientIds = [...new Set(reservations.map(r => r.client.id))]
const { data: rodoMap } = useBatchCheckRodo(clientIds)

{rodoMap?.[reservation.client.id] ? (
  <Badge variant="outline" className="text-teal-600 border-teal-600">
    <ShieldCheck className="h-3 w-3" /> RODO
  </Badge>
) : (
  <Badge variant="outline" className="text-orange-500 border-orange-500">
    <ShieldAlert className="h-3 w-3" /> Brak RODO
  </Badge>
)}
```

**Deduplikacja:** `Set()` dla unikalnych `clientId` (rezerwacje tego samego klienta dzielą RODO)

### Contract Badge — Lista Rezerwacji

**Plik:** `components/reservations/reservations-list.tsx`

```tsx
const reservationIds = reservations.map(r => r.id)
const { data: contractMap } = useBatchCheckContract(reservationIds)

{contractMap?.[reservation.id] ? (
  <Badge variant="outline" className="text-blue-600 border-blue-600">
    <FileCheck className="h-3 w-3" /> Umowa
  </Badge>
) : (
  <Badge variant="outline" className="text-gray-400 border-gray-400">
    <FileX className="h-3 w-3" /> Brak umowy
  </Badge>
)}
```

### Deposit Status Badge

**Plik:** `components/reservations/reservations-list.tsx`

```tsx
const totalPaid = reservation.deposits
  .filter(d => d.status === 'PAID')
  .reduce((sum, d) => sum + Number(d.amount), 0)

const statusColor = totalPaid > 0 ? 'text-green-600' : 'text-gray-400'

<Badge variant="outline" className={statusColor}>
  <Banknote className="h-3 w-3" /> 
  {formatCurrency(totalPaid)} / {formatCurrency(reservation.totalPrice)}
</Badge>
```

### Badge Order

```
[RODO] [Umowa] [Zaliczka: X/Y zł] [Status: CONFIRMED]
```

---

## Phase 5: Testing 🆕

### Jest Configuration

**Plik:** `apps/backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types/**'
  ]
}
```

**Package.json scripts:**
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Test Setup

**Plik:** `apps/backend/src/tests/setup.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})
```

### Unit Tests — AttachmentService

**Plik:** `apps/backend/src/tests/attachment.service.test.ts`

**38 testów w 11 grupach:**

#### 1. `createAttachment()` — 9 testów
- ✅ Poprawne utworzenie załącznika CLIENT
- ✅ Poprawne utworzenie załącznika RESERVATION
- ✅ RODO redirect: RESERVATION → CLIENT
- ✅ RODO redirect: DEPOSIT → CLIENT (przez reservation)
- ✅ Error: nieistniejący CLIENT
- ✅ Error: nieistniejąca RESERVATION
- ✅ Error: nieprawidłowa kategoria dla CLIENT
- ✅ Error: nieprawidłowa kategoria dla RESERVATION
- ✅ Error: brak `clientId` w rezerwacji (RODO redirect fail)

#### 2. `getAttachments()` — 4 testy
- ✅ Pobranie załączników dla CLIENT
- ✅ Filtrowanie po kategorii
- ✅ Wykluczenie zarchiwizowanych (default)
- ✅ Włączenie zarchiwizowanych (`includeArchived: true`)

#### 3. `getAttachmentsWithClientRodo()` — 3 testy
- ✅ Cross-reference RODO dla RESERVATION
- ✅ Cross-reference RODO dla DEPOSIT
- ✅ Brak cross-ref dla CLIENT (zwraca tylko własne)

#### 4. `updateAttachment()` — 3 testy
- ✅ Aktualizacja label i description
- ✅ Zmiana kategorii (walidacja per entityType)
- ✅ Error: nieprawidłowa kategoria dla entityType

#### 5. `deleteAttachment()` — 2 testy
- ✅ Soft-delete (ustawienie `isArchived=true`)
- ✅ Error: załącznik nie istnieje

#### 6. `hardDeleteAttachment()` — 2 testy
- ✅ Usunięcie pliku z dysku + rekord z DB
- ✅ Error: plik nie istnieje na dysku

#### 7. `batchCheckRodo()` — 4 testy
- ✅ Zwraca mapę `{ clientId: boolean }`
- ✅ `true` dla klientów z RODO
- ✅ `false` dla klientów bez RODO
- ✅ Działa dla pustej tablicy

#### 8. `batchCheckContract()` — 3 testy
- ✅ Zwraca mapę `{ reservationId: boolean }`
- ✅ `true` dla rezerwacji z umową
- ✅ `false` dla rezerwacji bez umowy

#### 9. `hasAttachment()` — 3 testy
- ✅ `true` gdy kategoria istnieje
- ✅ `false` gdy kategoria nie istnieje
- ✅ Ignoruje zarchiwizowane

#### 10. `countByCategory()` — 2 testy
- ✅ Zwraca mapę `{ category: count }`
- ✅ Ignoruje zarchiwizowane

#### 11. `getFilePath()` — 2 testy
- ✅ Zwraca pełną ścieżkę do pliku
- ✅ Error: plik nie istnieje na dysku

### Running Tests

```bash
# W kontenerze backend
docker compose run --rm backend npm test

# Watch mode
docker compose run --rm backend npm run test:watch

# Coverage report
docker compose run --rm backend npm run test:coverage
```

**Wynik:**
```
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        2.456 s
```

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
- `apps/backend/jest.config.js` — Jest configuration 🆕
- `apps/backend/src/tests/setup.ts` — Prisma mock setup 🆕
- `apps/backend/src/tests/attachment.service.test.ts` — 38 unit tests 🆕
- `apps/backend/uploads/` — katalog storage (volume Docker)

### Frontend — Nowe komponenty
- `apps/frontend/components/attachments/attachment-panel.tsx` — panel z cross-ref RODO, TanStack Query
- `apps/frontend/components/attachments/attachment-upload-dialog.tsx` — drag & drop upload, dynamiczne kategorie
- `apps/frontend/components/attachments/attachment-preview.tsx` — modal podglądu PDF/obrazy 🆕
- `apps/frontend/components/attachments/attachment-row.tsx` — wiersz załącznika, nowe badge kolory
- `apps/frontend/hooks/use-attachments.ts` — TanStack Query hooks 🆕
- `apps/frontend/lib/api/attachments.ts` — API client + `getCategoriesForEntity()`, `ALLOWED_MIME_TYPES`

### Frontend — Zmodyfikowane
- `apps/frontend/app/dashboard/clients/[id]/page.tsx` — AttachmentPanel + fix Wydano
- `apps/frontend/app/dashboard/reservations/[id]/page.tsx` — AttachmentPanel
- `apps/frontend/components/deposits/deposit-actions.tsx` — dialog Załączniki
- `apps/frontend/components/reservations/reservations-list.tsx` — RodoBadge + ContractBadge + DepositBadge 🆕
- `apps/frontend/components/clients/clients-list.tsx` — RodoBadge 🆕

---

## Kolejność badge'y na liście rezerwacji

```
[RODO] [Umowa] [Zaliczka: X/Y zł] [Status]
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

---

## Podsumowanie implementacji

| Faza | Status | Czas | Pliki | Testy |
|------|--------|------|-------|-------|
| **1. Backend API** | ✅ | ~4h | 8 | 38 unit tests |
| **2. Frontend Components** | ✅ | ~3h | 5 | Manual |
| **3. Sheet Integration** | ✅ | ~1h | 3 | Manual |
| **4. Badges** | ✅ | ~2h | 2 | Manual |
| **5. Testing** | ✅ | ~2h | 3 | 38 passing |
| **Łącznie** | ✅ | ~12h | 21 | 38 unit |

---

## Linki

- **Issue:** [#55 — Moduł załączników](https://github.com/kamil-gol/Go-ciniec_2/issues/55)
- **Pull Request:** [#71 — Attachments frontend + tests](https://github.com/kamil-gol/Go-ciniec_2/pull/71)
- **API Documentation:** [docs/API_DOCUMENTATION.md](./API_DOCUMENTATION.md#attachments-api)
- **Sprint 7 Summary:** [docs/SPRINTS.md](./SPRINTS.md)
