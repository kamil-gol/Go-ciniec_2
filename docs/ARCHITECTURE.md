# 🏭️ Architektura Systemu - Rezerwacje Sal

## Przegląd Architektury

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + TypeScript)              │   │
│  │  - Dashboard                                         │   │
│  │  - Rezerwacje                                        │   │
│  │  - Klienci                                           │   │
│  │  - Admin Panel                                       │   │
│  │  - Analytics                                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────────────────┘
                  │ HTTPS/REST API
                  │
┌─────────────────┴────────────────────────────────────────────┐
│                     API LAYER (Backend)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                             │   │
│  │  ┌────────────┬──────────────┬───────────────────┐  │   │
│  │  │ Auth       │ Reservations │ Clients           │  │   │
│  │  │ Controllers│ Controllers  │ Controllers       │  │   │
│  │  └────────────┴──────────────┴───────────────────┘  │   │
│  │  ┌────────────┬──────────────┬───────────────────┐  │   │
│  │  │ Auth       │ Reservation  │ Client            │  │   │
│  │  │ Services   │ Services     │ Services          │  │   │
│  │  ├────────────┤              ├───────────────────┤  │   │
│  │  │ Validation │ Price        │ Email             │  │   │
│  │  │ Middleware │ Calculator   │ Service           │  │   │
│  │  │ JWT Auth   │ PDF Generator│ Backup Service    │  │   │
│  │  │            │ Attachments  │ Attachment Srv    │  │   │
│  │  └────────────┴──────────────┴───────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌───────┐ ┌──────┐ ┌───────┐
    │  DB   │ │Redis │ │ Email │
    │  PG   │ │Cache │ │Queue  │
    └───────┘ └──────┘ └───────┘
```

## Warstwy Systemu

### 1. **Presentation Layer (Frontend)**

**Stack**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + Framer Motion
- TanStack Query (React Query) 🆕

**Struktura**:
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── reservations/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx          # Szczegóły + inline editing
│   │   │   └── new/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── users/page.tsx
│   │       ├── halls/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── settings/page.tsx
│   ├── layout.tsx
│   └── error.tsx
├── components/
│   ├── ui/                            # Bazowe komponenty UI
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TimePicker.tsx
│   │   ├── Sheet.tsx                  # 🆕 Drawer/Sheet component
│   │   └── ...
│   ├── reservations/
│   │   ├── editable/                  # Inline editing (PR #54)
│   │   │   ├── EditableCard.tsx       # Generyczny wrapper view/edit
│   │   │   ├── StatusChanger.tsx      # Zmiana statusu w hero
│   │   │   ├── EditableHallCard.tsx   # Sala + availability check
│   │   │   ├── EditableEventCard.tsx  # Typ/data/czas + DatePicker
│   │   │   ├── EditableGuestsCard.tsx # Goście + capacity validation
│   │   │   ├── EditableNotesCard.tsx  # Notatki + deadline
│   │   │   └── index.ts              # Barrel export
│   │   ├── reservations-list.tsx       # Lista rezerwacji
│   │   ├── create-reservation-form.tsx # Formularz tworzenia
│   │   ├── ReservationMenuSection.tsx  # Menu (już interaktywne)
│   │   ├── ReservationFinancialSummary.tsx  # Finanse
│   │   ├── ReservationDepositsSection.tsx   # Zaliczki
│   │   └── reservation-history.tsx     # Historia zmian
│   ├── attachments/                   # 🆕 Moduł załączników (PR #71)
│   │   ├── attachment-panel.tsx       # Lista + filtry + liczniki
│   │   ├── attachment-upload-dialog.tsx  # Drag & drop upload
│   │   ├── attachment-preview.tsx     # Modal: PDF iframe, image zoom
│   │   └── attachment-row.tsx         # Wiersz z badge, menu, preview
│   ├── deposits/
│   │   └── deposit-actions.tsx        # Dropdown z załącznikami
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── ReservationForm.tsx
│   │   └── ClientForm.tsx
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── Header.tsx
│   └── shared/                        # Wspólne komponenty
├── hooks/
│   ├── useAuth.ts
│   ├── useReservations.ts
│   ├── useCheckAvailability.ts         # Sprawdzanie dostępności sali
│   ├── use-attachments.ts              # 🆕 TanStack Query hooks (PR #71)
│   ├── useForm.ts
│   └── ...
├── lib/
│   ├── api/
│   │   ├── reservations.ts
│   │   ├── attachments.ts              # 🆕 API client + getCategoriesForEntity()
│   │   └── ...
│   └── utils.ts
├── utils/
│   ├── api.ts
│   ├── validation.ts
│   ├── formatting.ts
│   └── ...
├── __tests__/
│   ├── components/
│   └── hooks/
├── e2e/
│   ├── login.spec.ts
│   ├── reservations.spec.ts
│   └── ...
└── styles/
    └── globals.css
```

> **Uwaga:** Pliki `edit-reservation-modal.tsx` i `reservation-details-modal.tsx` zostały usunięte w PR #54 (15.02.2026). Edycja rezerwacji odbywa się teraz inline na stronie `/dashboard/reservations/[id]`.

**Odpowiedzialności**:
- Renderowanie UI
- User interactions
- Inline editing rezerwacji (EditableCard pattern)
- Form validation (client-side)
- API communication
- State management (TanStack Query) 🆕
- Authentication handling
- File upload & preview (attachments) 🆕

---

### 2. **API Layer (Backend)**

**Stack**:
- Express.js
- TypeScript
- Prisma ORM
- JWT Authentication
- Multer (file uploads) 🆕

**Struktura**:
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── reservationController.ts
│   │   ├── clientController.ts
│   │   ├── userController.ts
│   │   ├── hallController.ts
│   │   ├── analyticsController.ts
│   │   ├── attachmentController.ts     # 🆕 Upload, download, batch-check (PR #71)
│   │   └── adminController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── reservationService.ts
│   │   │   ├── priceCalculator.ts
│   │   │   └── validations.ts
│   │   ├── clientService.ts
│   │   ├── emailService.ts
│   │   ├── pdfService.ts
│   │   ├── backupService.ts
│   │   ├── analyticsService.ts
│   │   ├── attachmentService.ts        # 🆕 CRUD + RODO redirect + batch-check
│   │   └── userService.ts
│   ├── models/
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   ├── logger.ts
│   │   ├── cors.ts
│   │   ├── upload.ts                   # 🆕 Multer config (MIME validation, 10MB limit)
│   │   └── rateLimit.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── reservations.routes.ts
│   │   ├── clients.routes.ts
│   │   ├── users.routes.ts
│   │   ├── halls.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── attachment.routes.ts        # 🆕 8 REST endpoints
│   │   ├── admin.routes.ts
│   │   └── health.routes.ts
│   ├── constants/
│   │   ├── attachmentCategories.ts     # 🆕 Kategorie per entityType, MIME types
│   │   └── ...
│   ├── types/
│   │   ├── attachment.types.ts         # 🆕 DTO, filters, response types
│   │   └── ...
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── email-templates.ts
│   │   └── validators.ts
│   ├── jobs/
│   │   ├── emailReminders.ts
│   │   ├── backupScheduler.ts
│   │   └── archiveReservations.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   ├── setup.ts                   # 🆕 Jest + Prisma mock setup
│   │   └── attachment.service.test.ts  # 🆕 38 unit tests (11 grup)
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/                           # 🆕 File storage (Docker volume)
│   ├── clients/
│   ├── reservations/
│   └── deposits/
├── scripts/
│   ├── init-db.sql
│   └── seed.ts
├── jest.config.js                     # 🆕 Jest configuration
└── Dockerfile
```

**Odpowiedzialności**:
- HTTP request handling
- Business logic
- Database access (Prisma)
- Authentication & Authorization
- Input validation
- Error handling
- Email sending
- PDF generation
- File upload & storage (attachments) 🆕
- RODO redirect logic 🆕
- Reporting

---

### 3. **Data Layer**

**Database: PostgreSQL**

```sql
Databases:
- rezerwacje (production)
- rezerwacje_test (testing)

Main Tables:
- users
- halls
- event_types
- reservations
- reservation_history
- clients
- deposits
- attachments              🆕 (polymorphic: CLIENT | RESERVATION | DEPOSIT)
- activity_logs
```

**Cache: Redis**
- Session storage
- Auth tokens
- Frequently accessed data
- Queue for async jobs

---

## Design Patterns

### 1. **MVC Pattern**
- **Models**: Prisma schemas
- **Views**: React components
- **Controllers**: Express route handlers

### 2. **Service Layer Pattern**
- Business logic separated into services
- Controllers call services
- Services handle database operations
- Easy testing and reusability

### 3. **EditableCard Pattern**
- Generyczny wrapper dla inline editing
- View mode → Edit mode z animacją framer-motion
- Wymagany powód zmiany (audit trail)
- Walidacja przed zapisem
- Używany przez: StatusChanger, EditableHallCard, EditableEventCard, EditableGuestsCard, EditableNotesCard

### 4. **TanStack Query Pattern** 🆕
- Centralized data fetching & caching
- Query factory pattern (`attachmentKeys`)
- Automatic cache invalidation po mutacjach
- Optimistic updates
- Background refetching
- Eliminacja `useState` + `useEffect` boilerplate
- Używany w: attachments module (useAttachments, useBatchCheckRodo, useBatchCheckContract)

### 5. **Middleware Pattern**
- Authentication middleware
- Error handling
- Request logging
- Validation
- CORS
- File upload (Multer) 🆕

### 6. **Repository Pattern (via Prisma)**
- Centralized data access
- Abstraction from database

### 7. **Factory Pattern**
- Email service factory
- PDF generator factory

### 8. **RODO Redirect Pattern** 🆕
- Automatic attachment redirection based on category
- RODO category zawsze przypisywane do CLIENT (niezależnie od źródła uploadu)
- Cross-reference w widokach RESERVATION/DEPOSIT
- Polymorphic file storage per entityType

---

## Authentication Flow

```
┌──────────────┐
│  User Login  │
└──────┬───────┘
       │ POST /api/auth/login
       │ { email, password }
       ▼
┌──────────────────────────┐
│ Validate credentials     │
│ Hash password comparison │
└──────┬───────────────────┘
       │
       ├─ Valid?
       │   YES
       ▼
┌──────────────────────────┐
│ Generate JWT token       │
│ Set refresh token        │
│ Store in Redis           │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Return tokens to client  │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Client stores JWT        │
│ Adds to Authorization    │
│ header on requests       │
└──────────────────────────┘
```

---

## Price Calculation Engine

```typescript
interface PriceCalculation {
  basePrice: number;          // guests * pricePerPerson
  overtimeHours: number;      // hours > 6
  overtimePrice: number;      // overtimeHours * hourlyRate
  totalPrice: number;         // basePrice + overtimePrice
  depositAmount: number;      // if deposit enabled
  depositDueDate: Date;       // max day before event
}

Calculation Logic:
1. Get hall capacity & price per person
2. Validate guests <= capacity
3. Calculate base price = guests * pricePerPerson
4. Calculate overtime hours = max(0, hours - 6)
5. Calculate hourly rate = pricePerPerson / 2 (or configurable)
6. Calculate overtime price = overtimeHours * hourlyRate
7. Total price = basePrice + overtimePrice
8. If deposit: validate depositAmount <= totalPrice
9. If deposit: depositDueDate must be <= eventDate - 1 day
```

---

## Email Sending System

**Architecture**: Event-driven with queue

```
Trigger (e.g., create reservation)
        ▼
   Email Event
        ▼
  Job Queue (Bull/BullMQ + Redis)
        ▼
  Email Worker
        ▼
  Email Template Rendering
        ▼
  SMTP Send (Nodemailer)
        ▼
  Retry Logic (exponential backoff)
        ▼
  Success/Failure Logging
```

**Email Templates**:
1. New Reservation Confirmation
2. Reservation Edited
3. Reservation Cancelled
4. Reminder 24h before
5. Deposit Payment Reminder (3 days)

---

## Reservation History Tracking

**Audit Trail**:
```typescript
interface ReservationHistory {
  id: string;
  reservationId: string;
  changedBy: string;          // userId
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue: Record<string, any>;   // previous state
  newValue: Record<string, any>;   // new state
  reason: string;             // why the change (required, min 10 chars)
  timestamp: Date;
}

// Tracked Fields:
- date
- startTime
- endTime
- guests (adults, children, toddlers)
- status
- notes
- totalPrice
- depositAmount
- depositDueDate
- hallId
- eventTypeId
```

---

## Security Architecture

### 1. **Authentication**
- JWT tokens with expiration
- Refresh token rotation
- Password hashing (bcrypt)
- 12-character password requirements

### 2. **Authorization**
- Role-based access control (RBAC)
- Roles: ADMIN, EMPLOYEE, CLIENT
- Middleware-based permission checks

### 3. **Input Validation**
- Server-side validation (all inputs)
- Sanitization to prevent XSS
- Rate limiting
- File upload validation (MIME type, size) 🆕

### 4. **API Security**
- CORS configured
- CSRF protection (optional with tokens)
- Security headers (helmet.js)
- HTTPS enforced

### 5. **Database Security**
- Parameterized queries (Prisma)
- SQL injection prevention
- Connection pooling

### 6. **File Security** 🆕
- MIME type whitelist (PDF, JPEG, PNG, WEBP)
- File size limit (10 MB)
- UUID-based filenames (prevent path traversal)
- Separate storage per entityType
- Soft-delete (archivization)

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│       Docker Compose Stack          │
│  ┌──────────────────────────────┐   │
│  │ Nginx (Reverse Proxy)        │   │
│  │ Port: 80/443                 │   │
│  └──────────┬───────────────────┘   │
│             │                       │
│    ┌────────┴────────┐             │
│    │                 │             │
│    ▼                 ▼             │
│  ┌────────┐     ┌─────────┐       │
│  │Frontend│     │ Backend │       │
│  │Next.js │     │Express  │       │
│  └───┬────┘     └────┬────┘       │
│      │               │             │
│      └───────┬───────┘             │
│              │                     │
│    ┌─────────┴──────────┐         │
│    │         │          │         │
│    ▼         ▼          ▼         │
│  ┌────┐  ┌────────┐  ┌──────┐    │
│  │PG  │  │Redis   │  │Mailer│   │
│  │DB  │  │Cache   │  │Queue │   │
│  └────┘  └────────┘  └──────┘    │
│                                   │
│  🆕 Persistent Volumes:            │
│  - postgres_data                   │
│  - redis_data                      │
│  - uploads/ (attachments storage)  │
└─────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Redis for distributed sessions
- Database read replicas
- Load balancer (Nginx)
- Shared file storage (NFS/S3 for uploads) 🆕

### Vertical Scaling
- Database indexing optimization
- Query optimization
- Caching strategy
- Code splitting (frontend)

---

## Monitoring & Logging

### Logging Levels
- DEBUG: Development
- INFO: General info
- WARN: Warnings
- ERROR: Errors
- FATAL: Critical issues

### Metrics to Monitor
- API response times
- Database query times
- Error rates
- Email delivery rate
- Backup success/failure
- User activity
- File upload success/failure 🆕
- Storage usage 🆕

---

## Performance Optimization

### Frontend
- Code splitting
- Image optimization
- Lazy loading
- Minification
- Compression (gzip)
- TanStack Query caching 🆕

### Backend
- Query optimization with indexes
- Connection pooling
- Caching with Redis
- Pagination
- Rate limiting
- Batch API endpoints (batch-check) 🆕

### Database
- Indexes on frequently queried columns
- Query analysis
- Connection pooling
- Archiving old data
- Composite indexes for polymorphic queries 🆕

---

**Last Updated**: 16.02.2026, 15:35 CET
