# 🏗️ Architektura Systemu - Rezerwacje Sal

## Przegląd Architektury

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + TypeScript)              │   │
│  │  - Dashboard                                         │   │
│  │  - Rezerwacje                                        │   │
│  │  - Klienci                                           │   │
│  │  - Admin Panel                                       │   │
│  │  - Analytics                                         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────────────┘
                  │ HTTPS/REST API
                  │
┌─────────────────▼──────────────────────────────────────────┐
│                     API LAYER (Backend)                     │
│  ┌────────────────────────────────────────────────────┐   │
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
│  │  └────────────┴──────────────┴───────────────────┘  │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
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
- React Query / TanStack Query

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
│   │   └── ...
│   ├── reservations/
│   │   ├── editable/                  # 🆕 Inline editing (PR #54)
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
│   ├── useForm.ts
│   └── ...
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
- State management (React Query)
- Authentication handling

---

### 2. **API Layer (Backend)**

**Stack**:
- Express.js
- TypeScript
- Prisma ORM
- JWT Authentication

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
│   │   └── rateLimit.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── reservations.routes.ts
│   │   ├── clients.routes.ts
│   │   ├── users.routes.ts
│   │   ├── halls.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── admin.routes.ts
│   │   └── health.routes.ts
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
│   │   └── fixtures/
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── init-db.sql
│   └── seed.ts
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

### 3. **EditableCard Pattern** 🆕
- Generyczny wrapper dla inline editing
- View mode → Edit mode z animacją framer-motion
- Wymagany powód zmiany (audit trail)
- Walidacja przed zapisem
- Używany przez: StatusChanger, EditableHallCard, EditableEventCard, EditableGuestsCard, EditableNotesCard

### 4. **Middleware Pattern**
- Authentication middleware
- Error handling
- Request logging
- Validation
- CORS

### 5. **Repository Pattern (via Prisma)**
- Centralized data access
- Abstraction from database

### 6. **Factory Pattern**
- Email service factory
- PDF generator factory

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

### 4. **API Security**
- CORS configured
- CSRF protection (optional with tokens)
- Security headers (helmet.js)
- HTTPS enforced

### 5. **Database Security**
- Parameterized queries (Prisma)
- SQL injection prevention
- Connection pooling

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
│    ┌─────────┼──────────┐         │
│    │         │          │         │
│    ▼         ▼          ▼         │
│  ┌────┐  ┌────────┐  ┌──────┐    │
│  │PG  │  │Redis   │  │Mailer│   │
│  │DB  │  │Cache   │  │Queue │   │
│  └────┘  └────────┘  └──────┘    │
└─────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Redis for distributed sessions
- Database read replicas
- Load balancer (Nginx)

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

---

## Performance Optimization

### Frontend
- Code splitting
- Image optimization
- Lazy loading
- Minification
- Compression (gzip)

### Backend
- Query optimization with indexes
- Connection pooling
- Caching with Redis
- Pagination
- Rate limiting

### Database
- Indexes on frequently queried columns
- Query analysis
- Connection pooling
- Archiving old data

---

**Last Updated**: 15.02.2026
