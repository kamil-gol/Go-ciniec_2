# 📊 Schemat Bazy Danych - Rezerwacje Sal

## Diagram ERD

```
┌──────────────────────────────┐
│ users                            │
├──────────────────────────────┤
│ PK  id                           │
│     email (unique)                │
│     password (hashed)             │
│     firstName                     │
│     lastName                      │
│     role (ADMIN|EMPLOYEE|CLIENT)  │
│     isActive                      │
│     createdAt                     │
│     updatedAt                     │
└──────────────────────────────┘
          │  1
          │ createdBy/updatedBy
          ▼
          M
┌──────────────────────────────┐
│ halls                            │
├──────────────────────────────┤
│ PK  id                           │
│     name                          │
│     capacity                      │
│     pricePerPerson                │
│     description                   │
│     isActive                      │
│     createdAt                     │
└──────────────────────────────┘
          │ 1
          │ hallId
          ▼
          M
┌─────────────────────────────────────┐
│ reservations                     │
├─────────────────────────────────────┤
│ PK  id                           │
│ FK  hallId ─────────────────▼ │
│ FK  clientId                     │
│ FK  eventTypeId                  │
│ FK  createdBy                    │
│     date                          │
│     startTime                     │
│     endTime                       │
│     guests                        │
│     totalPrice                    │
│     status                        │
│     notes                         │
│     depositAmount                 │
│     depositDueDate                │
│     attachments (array)           │
│     archivedAt                    │
│     createdAt                     │
│     updatedAt                     │
└─────────────────────────────────────┘
       │ 1          │ 1          │ 1
       │ id         │ id         │ id
       ▼            ▼            ▼
       M            M            M
┌──────────────────────────────┐
│ clients                          │
├──────────────────────────────┤
│ PK  id                           │
│     firstName                     │
│     lastName                      │
│     email                         │
│     phone                         │
│     address                       │
│     notes                         │
│     createdAt                     │
│     updatedAt                     │
└──────────────────────────────┘

┌──────────────────────────────┐
│ eventTypes                       │
├──────────────────────────────┤
│ PK  id                           │
│     name (wesele, urodziny)      │
└──────────────────────────────┘

┌─────────────────────────────────────┐
│ reservationHistory               │
├─────────────────────────────────────┤
│ PK  id                           │
│ FK  reservationId                │
│ FK  changedBy                    │
│     changeType (CREATE/UPDATE)    │
│     fieldName                     │
│     oldValue                      │
│     newValue                      │
│     reason                        │
│     createdAt                     │
└─────────────────────────────────────┘

┌──────────────────────────────┐
│ deposits                         │
├──────────────────────────────┤
│ PK  id                           │
│ FK  reservationId                │
│     amount                        │
│     dueDate                       │
│     paid                          │
│     paidDate                      │
│     paymentMethod                 │
│     createdAt                     │
└──────────────────────────────┘

┌──────────────────────────────┐
│ activityLogs                     │
├──────────────────────────────┤
│ PK  id                           │
│ FK  userId                       │
│     action                        │
│     entityType                    │
│     entityId                      │
│     details                       │
│     ipAddress                     │
│     userAgent                     │
│     createdAt                     │
└──────────────────────────────┘
```

---

## Tabele Szczegółowo

### 1. **users**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,           -- bcrypt hash
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',  -- ADMIN, EMPLOYEE, CLIENT
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('ADMIN', 'EMPLOYEE', 'CLIENT')),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Field Details**:
- `id`: UUID primary key (auto-generated)
- `email`: Unique email, validated
- `password`: bcrypt hashed password (min 12 chars)
- `role`: ADMIN (full access), EMPLOYEE (reservation mgmt), CLIENT (view only)
- `isActive`: Soft deletion indicator

---

### 2. **halls** (Sale)

```sql
CREATE TABLE halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    pricePerPerson DECIMAL(10, 2) NOT NULL CHECK (pricePerPerson > 0),
    description TEXT,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_halls_name ON halls(name);
CREATE INDEX idx_halls_active ON halls(isActive);
```

**Example Data**:
```json
[
  {
    "name": "Sala Krysztalowa",
    "capacity": 40,
    "pricePerPerson": 250.00,
    "description": "Elegancka sala dla małych weseli"
  },
  {
    "name": "Sala Złota",
    "capacity": 80,
    "pricePerPerson": 300.00,
    "description": "Spaceła sala dla większych imprez"
  },
  {
    "name": "Sala Bankietowa",
    "capacity": 150,
    "pricePerPerson": 350.00,
    "description": "Największa sala dla gal imprez"
  }
]
```

---

### 3. **eventTypes** (Typy Wydarzeń)

```sql
CREATE TABLE eventTypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eventTypes_name ON eventTypes(name);
```

**Example Data**:
```json
[
  "Wesele",
  "Urodziny",
  "Rocznica",
  "Komunia",
  "Bal",
  "Konferencja",
  "Andrzejki",
  "Wigilia"
]
```

---

### 4. **clients** (Klienci)

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name ON clients(firstName, lastName);
```

---

### 5. **reservations** (Rezerwacje)

```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hallId UUID NOT NULL REFERENCES halls(id) ON DELETE RESTRICT,
    clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    eventTypeId UUID NOT NULL REFERENCES eventTypes(id),
    createdBy UUID NOT NULL REFERENCES users(id),
    
    date DATE NOT NULL CHECK (date >= CURRENT_DATE),
    startTime TIME NOT NULL,
    endTime TIME NOT NULL CHECK (endTime > startTime),
    guests INTEGER NOT NULL CHECK (guests > 0),
    
    totalPrice DECIMAL(10, 2) NOT NULL CHECK (totalPrice > 0),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    
    depositAmount DECIMAL(10, 2),
    depositDueDate DATE,
    depositPaid BOOLEAN DEFAULT false,
    
    attachments TEXT[],
    archivedAt TIMESTAMP,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_deposit_amount CHECK (
        depositAmount IS NULL OR (depositAmount > 0 AND depositAmount <= totalPrice)
    ),
    CONSTRAINT valid_deposit_due CHECK (
        depositAmount IS NULL OR depositDueDate IS NOT NULL
    ),
    CONSTRAINT valid_deposit_date CHECK (
        depositDueDate IS NULL OR depositDueDate < date
    )
);

CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_hall ON reservations(hallId);
CREATE INDEX idx_reservations_client ON reservations(clientId);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_createdBy ON reservations(createdBy);
```

**Validations**:
- `date >= CURRENT_DATE` - Not in past
- `endTime > startTime` - Valid time range
- `guests > 0` - At least 1 guest
- `guests <= hall.capacity` - Not exceed room capacity (application level)
- `totalPrice > 0` - Valid price
- `depositAmount <= totalPrice` - Deposit not exceed total
- `depositDueDate < date` - Due before event
- `status` - Only valid statuses

---

### 6. **reservationHistory** (Historia Zmian)

```sql
CREATE TABLE reservationHistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservationId UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    changedBy UUID NOT NULL REFERENCES users(id),
    
    changeType VARCHAR(20) NOT NULL CHECK (changeType IN ('CREATE', 'UPDATE', 'DELETE')),
    fieldName VARCHAR(100),
    oldValue TEXT,
    newValue TEXT,
    reason TEXT,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_reservation ON reservationHistory(reservationId);
CREATE INDEX idx_history_changedBy ON reservationHistory(changedBy);
CREATE INDEX idx_history_createdAt ON reservationHistory(createdAt);
```

**Change Types**:
- `CREATE` - New reservation
- `UPDATE` - Field modification
- `DELETE` - Cancellation

**Example History Entry**:
```json
{
  "reservationId": "res-123",
  "changedBy": "user-456",
  "changeType": "UPDATE",
  "fieldName": "guests",
  "oldValue": "30",
  "newValue": "35",
  "reason": "Dodatkowi goście potwierdzeni",
  "createdAt": "2026-02-06T14:30:00Z"
}
```

---

### 7. **deposits** (Zaliczki)

```sql
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservationId UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    dueDate DATE NOT NULL,
    paid BOOLEAN DEFAULT false,
    paidDate TIMESTAMP,
    paymentMethod VARCHAR(50),  -- e.g., 'CASH', 'TRANSFER', 'CARD'
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_paid_date CHECK (
        (paid = false AND paidDate IS NULL) OR
        (paid = true AND paidDate IS NOT NULL)
    )
);

CREATE INDEX idx_deposits_reservation ON deposits(reservationId);
CREATE INDEX idx_deposits_dueDate ON deposits(dueDate);
CREATE INDEX idx_deposits_paid ON deposits(paid);
```

---

### 8. **activityLogs** (Logi Aktywności)

```sql
CREATE TABLE activityLogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,           -- e.g., 'CREATE_RESERVATION'
    entityType VARCHAR(50),                 -- e.g., 'RESERVATION'
    entityId VARCHAR(100),
    details JSONB,
    
    ipAddress INET,
    userAgent TEXT,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activityLogs_user ON activityLogs(userId);
CREATE INDEX idx_activityLogs_createdAt ON activityLogs(createdAt);
CREATE INDEX idx_activityLogs_action ON activityLogs(action);
```

**Example Log**:
```json
{
  "action": "CREATE_RESERVATION",
  "entityType": "RESERVATION",
  "entityId": "res-123",
  "details": {
    "hallName": "Sala Krysztalowa",
    "clientName": "Jan Kowalski",
    "guests": 30,
    "totalPrice": 7500
  }
}
```

---

## Migrations

### Migration Workflow

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name <name>

# 3. Apply migration to test DB
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate
```

### Key Migrations

1. **001_init** - Initial schema (all tables)
2. **002_add_indexes** - Performance indexes
3. **003_add_constraints** - Data constraints
4. **004_seed_data** - Test data

---

## Seed Data

```typescript
// Prisma seed script
async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gosciniecrodzinny.pl',
      password: hashPassword('AdminPass2026!'),
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN'
    }
  });

  // Create halls
  const halls = await prisma.hall.createMany({
    data: [
      {
        name: 'Sala Krysztalowa',
        capacity: 40,
        pricePerPerson: 250,
        description: 'Elegancka sala dla małych weseli'
      },
      // ...
    ]
  });

  // Create event types
  const eventTypes = await prisma.eventType.createMany({
    data: [
      { name: 'Wesele' },
      { name: 'Urodziny' },
      // ...
    ]
  });

  console.log('Seed completed!');
}
```

---

## Performance Considerations

### Indexes
- Queries on `date` range (common filter)
- Queries on `hallId` (reservation by hall)
- Queries on `clientId` (client history)
- Queries on `status` (filtering)
- Queries on `createdBy` (user activity)

### Query Optimization
- Use pagination (limit 20-100)
- Eager load relations
- Avoid N+1 queries
- Use database-level aggregations

### Partitioning
- Consider partitioning `reservations` by date range (yearly)
- Archive old data
- Separate test database

---

## Data Integrity

### Referential Integrity
- `reservations.hallId` -> `halls.id` (CASCADE)
- `reservations.clientId` -> `clients.id` (CASCADE)
- `reservations.createdBy` -> `users.id` (RESTRICT)
- `reservationHistory.reservationId` -> `reservations.id` (CASCADE)
- `activityLogs.userId` -> `users.id` (SET NULL)

### Constraints
- NOT NULL on critical fields
- UNIQUE on identifiers
- CHECK constraints for valid values
- Foreign key constraints

---

## Backup Strategy

### Daily Backups
```bash
pg_dump -U rezerwacje -d rezerwacje > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Retention Policy
- Keep 30 daily backups
- Weekly archive
- Monthly snapshots

---

**Last Updated**: 06.02.2026