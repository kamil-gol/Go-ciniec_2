# 💰 Deposits Module - Frontend Implementation Guide

## ✅ Completed

### 1. **TypeScript Types** (`src/types/deposit.ts`)
- ✅ `DepositStatus`, `PaymentMethod` enums
- ✅ `Deposit`, `DepositPayment` interfaces
- ✅ `DepositStatistics` interface
- ✅ `CreateDepositRequest`, `AddPaymentRequest` DTOs
- ✅ `DepositFilters` for queries

### 2. **API Service** (`src/services/depositService.ts`)
- ✅ `getDeposits()` - list with pagination & filters
- ✅ `getDeposit(id)` - single deposit
- ✅ `getReservationDeposits()` - by reservation
- ✅ `createDeposit()` - create new
- ✅ `updateDeposit()` - update existing
- ✅ `deleteDeposit()` - delete
- ✅ `addPayment()` - add payment
- ✅ `getStatistics()` - dashboard stats
- ✅ `getPendingReminders()` - reminders list
- ✅ `markReminderSent()` - mark reminder

### 3. **Statistics Component** (`src/components/deposits/DepositStats.tsx`)
- ✅ 4 stat cards with icons
- ✅ Total deposits & amount
- ✅ Paid deposits & amount
- ✅ Pending deposits & remaining
- ✅ Overdue deposits & upcoming
- ✅ Loading skeleton
- ✅ Error handling
- ✅ Auto-refresh capability

---

## 📋 TODO - Remaining Components

### Priority 1: Core Components

#### **DepositList Component** (`src/components/deposits/DepositList.tsx`)
Main list with filters and pagination.

```tsx
- Search by client name
- Filter by status (PENDING, PAID, OVERDUE, PARTIAL)
- Filter by date range
- Sort by: dueDate, amount, createdAt
- Pagination controls
- Status badges with colors
- Quick actions: view, pay, edit, delete
- Empty state when no deposits
```

#### **DepositForm Component** (`src/components/deposits/DepositForm.tsx`)
Create/edit deposit modal.

```tsx
- Reservation selector (with search)
- Amount input (PLN)
- Due date picker
- Title input (optional)
- Description textarea (optional)
- Validation:
  - Amount > 0
  - Amount <= reservation totalPrice
  - dueDate not in past
- Submit & Cancel buttons
```

#### **PaymentModal Component** (`src/components/deposits/PaymentModal.tsx`)
Add payment to existing deposit.

```tsx
- Display deposit info:
  - Total amount
  - Already paid
  - Remaining amount
- Payment amount input
  - Max = remainingAmount
  - Validation: amount > 0
- Payment method selector:
  - CASH (Gotówka)
  - TRANSFER (Przelew)
  - CARD (Karta)
- Notes textarea (optional)
- Submit button:
  - "Dodaj częściową wpłatę" if < remaining
  - "Oznacz jako opłaconą" if = remaining
```

### Priority 2: Detail Views

#### **DepositDetails Component** (`src/components/deposits/DepositDetails.tsx`)
Full deposit details view.

```tsx
- Deposit information card:
  - Status badge
  - Amount, paid, remaining
  - Due date (with overdue indicator)
  - Title, description
  - Receipt number (if paid)
- Reservation details card:
  - Client name, email, phone
  - Event date, hall, event type
  - Total guests
  - Link to reservation
- Payment history table:
  - Date, amount, method
  - Receipt number
  - Notes
  - Chronological order
- Action buttons:
  - Add payment (if not fully paid)
  - Edit deposit
  - Delete deposit
  - Send reminder (if overdue)
  - Print receipt (if paid)
```

### Priority 3: Dashboard Page

#### **Deposits Page** (`src/app/deposits/page.tsx`)
Main deposits dashboard.

```tsx
'use client';

import DepositStats from '@/components/deposits/DepositStats';
import DepositList from '@/components/deposits/DepositList';

export default function DepositsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zaliczki</h1>
        <button className="btn-primary">
          + Nowa zaliczka
        </button>
      </div>

      <DepositStats />

      <div className="bg-white rounded-lg shadow">
        <DepositList />
      </div>
    </div>
  );
}
```

### Priority 4: Integration

#### **Reservation Integration**
Show deposits in reservation view.

```tsx
// In ReservationDetails component
import { depositService } from '@/services/depositService';

// Load deposits for reservation
const [deposits, setDeposits] = useState([]);

useEffect(() => {
  depositService
    .getReservationDeposits(reservationId)
    .then(setDeposits);
}, [reservationId]);

// Show deposits card
<div className="mt-6">
  <h3>Zaliczki</h3>
  {deposits.map(deposit => (
    <DepositCard key={deposit.id} deposit={deposit} />
  ))}
  <button onClick={handleAddDeposit}>
    + Dodaj zaliczkę
  </button>
</div>
```

---

## 🎨 Design Guidelines

### Status Colors
```tsx
PENDING:  bg-yellow-100 text-yellow-800
PARTIAL:  bg-blue-100 text-blue-800
PAID:     bg-green-100 text-green-800
OVERDUE:  bg-red-100 text-red-800
```

### Icons (Emoji)
```
Deposit:  💰
Payment:  💳
Cash:     💵
Transfer: 🏦
Card:     💳
Paid:     ✅
Pending:  ⏳
Overdue:  ⚠️
Reminder: 🔔
```

### Currency Format
```tsx
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
  }).format(amount);
};
```

### Date Format
```tsx
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

---

## 🧪 Testing Checklist

### Statistics Component ✅
- [ ] Loads data on mount
- [ ] Shows loading skeleton
- [ ] Displays correct numbers
- [ ] Formats currency properly
- [ ] Handles errors gracefully
- [ ] Retry button works

### List Component
- [ ] Displays all deposits
- [ ] Pagination works
- [ ] Filters update list
- [ ] Search finds deposits
- [ ] Status badges show correctly
- [ ] Actions trigger modals

### Form Component
- [ ] Validates all fields
- [ ] Shows error messages
- [ ] Creates deposit successfully
- [ ] Updates existing deposit
- [ ] Closes on success

### Payment Modal
- [ ] Shows correct amounts
- [ ] Validates payment
- [ ] Prevents overpayment
- [ ] Changes status to PARTIAL
- [ ] Changes status to PAID when full
- [ ] Generates receipt number

---

## 🚀 Development Steps

1. **Test existing components:**
   ```bash
   cd /home/kamil/rezerwacje
   git checkout feature/deposits-frontend
   git pull origin feature/deposits-frontend
   
   cd apps/frontend
   npm install
   npm run dev
   ```

2. **Create DepositList component** (priority 1)

3. **Create DepositForm component** (priority 1)

4. **Create PaymentModal component** (priority 1)

5. **Create DepositDetails component** (priority 2)

6. **Create main page** (priority 3)

7. **Integrate with Reservations** (priority 4)

8. **Test everything** 🧪

9. **Merge to main** 🎉

---

## 📚 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deposits` | List all deposits |
| GET | `/api/deposits/:id` | Get single deposit |
| GET | `/api/deposits/statistics` | Get statistics |
| GET | `/api/deposits/reminders/pending` | Get pending reminders |
| GET | `/api/reservations/:id/deposits` | Get deposits for reservation |
| POST | `/api/deposits` | Create deposit |
| PUT | `/api/deposits/:id` | Update deposit |
| DELETE | `/api/deposits/:id` | Delete deposit |
| POST | `/api/deposits/:id/payments` | Add payment |
| PUT | `/api/deposits/:id/reminder-sent` | Mark reminder sent |

---

## 🎯 Current Status

**Sprint:** Frontend Foundation  
**Progress:** 30% (3/10 components)  
**Ready for:** Core components development

✅ Types & API  
✅ Statistics Component  
⏳ List Component  
⏳ Form Component  
⏳ Payment Modal  
⏳ Details View  
⏳ Main Page  
⏳ Integration  

**Next Step:** Create DepositList component with filters and pagination
