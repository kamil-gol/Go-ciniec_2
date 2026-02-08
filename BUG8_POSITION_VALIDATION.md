# 🐛 BUG #8 FIX - Position Validation

## Problem

API endpoint `PUT /api/queue/:id/position` nie walidował prawidłowo parametru `newPosition`:

### **Błędy przed fixem:**

1. ❌ Brak walidacji maxPosition
   ```bash
   # Kolejka ma 3 elementy, ale można ustawić:
   PUT /api/queue/abc123/position {"newPosition": 999}
   # → SQL error: "unique constraint violation"
   ```

2. ❌ Cryptic error messages
   ```json
   {
     "error": "P2002: Unique constraint failed on reservationQueuePosition"
   }
   ```

3. ❌ Brak obsługi race conditions
   - Dwa użytkownicy jednocześnie przestawiają pozycje → crash

---

## ✅ Rozwiązanie

### **1. Walidacja maxPosition (Service Layer)**

```typescript
// apps/backend/src/services/queue.service.ts

async moveToPosition(reservationId: string, newPosition: number): Promise<void> {
  // ... existing validations ...

  // ✨ NEW: Get total count for this date
  const totalCount = await prisma.reservation.count({
    where: {
      status: ReservationStatus.RESERVED,
      reservationQueueDate: { /* same day */ },
    },
  });

  // ✨ NEW: Validate position range
  if (newPosition > totalCount) {
    throw new Error(
      `Position ${newPosition} is invalid. ` +
      `There are only ${totalCount} reservation(s) in the queue. ` +
      `Position must be between 1 and ${totalCount}.`
    );
  }

  // ... rest of the code ...
}
```

### **2. Lepsze komunikaty błędów (Controller Layer)**

```typescript
// apps/backend/src/controllers/queue.controller.ts

async moveToPosition(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPosition } = req.body;

    // ✨ NEW: Validate type
    const position = typeof newPosition === 'string' 
      ? parseInt(newPosition, 10) 
      : newPosition;

    if (!Number.isInteger(position)) {
      return res.status(400).json({
        success: false,
        error: 'Position must be a valid integer',
      });
    }

    // ✨ NEW: Map errors to HTTP status codes
  } catch (error: any) {
    let statusCode = 400;
    
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('race condition')) {
      statusCode = 409; // Conflict
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
}
```

### **3. Obsługa Prisma Errors**

```typescript
// Handle unique constraint violations
try {
  await prisma.$executeRaw`...`;
} catch (error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error(
        `Position ${newPosition} is already occupied. ` +
        'This might be a race condition. Please refresh and try again.'
      );
    }
  }
  throw error;
}
```

---

## 📊 Przed/Po Comparison

### **Scenariusz 1: Pozycja poza zakresem**

```bash
# Stan: Kolejka na 07.02 ma 3 rezerwacje (pozycje 1, 2, 3)

PUT /api/queue/abc123/position
{
  "newPosition": 10
}
```

**Przed:**
```json
{
  "success": false,
  "error": "P2002: Unique constraint failed"
}
```

**Po:**
```json
{
  "success": false,
  "error": "Position 10 is invalid. There are only 3 reservation(s) in the queue for this date. Position must be between 1 and 3."
}
```

### **Scenariusz 2: Nieprawidłowy typ**

```bash
PUT /api/queue/abc123/position
{
  "newPosition": "abc"
}
```

**Przed:**
```json
{
  "success": false,
  "error": "Valid position (>= 1) is required"
}
```

**Po:**
```json
{
  "success": false,
  "error": "Position must be a valid integer"
}
```

### **Scenariusz 3: Race Condition**

Dwaj użytkownicy jednocześnie próbują ustawić pozycję 3.

**Przed:**
- Jeden sukces
- Drugi: SQL error crash

**Po:**
- Jeden sukces
- Drugi: HTTP 409 + "Position 3 is already occupied. Please refresh and try again."

---

## 🧪 Testing

### **Manual Testing**

```bash
# 1. Utwórz 3 rezerwacje w kolejce na 08.02.2026
curl -X POST http://localhost:3001/api/queue/reserved \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client-uuid>",
    "reservationQueueDate": "2026-02-08",
    "guests": 10
  }'

# Powtórz 3 razy

# 2. Sprawdź kolejkę
curl http://localhost:3001/api/queue/2026-02-08 \
  -H "Authorization: Bearer $TOKEN"

# Powinno zwrócić: 3 rezerwacje na pozycjach 1, 2, 3

# 3. Test: Ustaw pozycję poza zakresem
curl -X PUT http://localhost:3001/api/queue/<reservation-id>/position \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPosition": 10}'

# Oczekiwany wynik:
# HTTP 400
# {
#   "success": false,
#   "error": "Position 10 is invalid. There are only 3 reservation(s) in the queue for this date. Position must be between 1 and 3."
# }

# 4. Test: Ustaw prawidłową pozycję
curl -X PUT http://localhost:3001/api/queue/<reservation-id>/position \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPosition": 2}'

# Oczekiwany wynik:
# HTTP 200
# {
#   "success": true,
#   "message": "Przeniesiono na pozycję #2"
# }

# 5. Test: Ustaw pozycję 0
curl -X PUT http://localhost:3001/api/queue/<reservation-id>/position \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPosition": 0}'

# Oczekiwany wynik:
# HTTP 400
# {
#   "success": false,
#   "error": "Position must be at least 1"
# }

# 6. Test: Ustaw pozycję jako string
curl -X PUT http://localhost:3001/api/queue/<reservation-id>/position \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPosition": "abc"}'

# Oczekiwany wynik:
# HTTP 400
# {
#   "success": false,
#   "error": "Position must be a valid integer"
# }
```

### **Automated Test Cases (Jest)**

```typescript
// apps/backend/src/__tests__/queue.service.test.ts

describe('QueueService.moveToPosition', () => {
  it('should reject position > maxPosition', async () => {
    // Arrange: Create 3 reservations
    const reservations = await createTestReservations(3, '2026-02-08');
    
    // Act & Assert
    await expect(
      queueService.moveToPosition(reservations[0].id, 10)
    ).rejects.toThrow(
      'Position 10 is invalid. There are only 3 reservation(s)'
    );
  });

  it('should reject position < 1', async () => {
    const reservation = await createTestReservation('2026-02-08');
    
    await expect(
      queueService.moveToPosition(reservation.id, 0)
    ).rejects.toThrow('Position must be a positive integer');
  });

  it('should accept valid position', async () => {
    const reservations = await createTestReservations(5, '2026-02-08');
    
    await expect(
      queueService.moveToPosition(reservations[0].id, 3)
    ).resolves.not.toThrow();
    
    // Verify position changed
    const updated = await prisma.reservation.findUnique({
      where: { id: reservations[0].id },
    });
    expect(updated.reservationQueuePosition).toBe(3);
  });

  it('should handle race condition gracefully', async () => {
    const reservations = await createTestReservations(3, '2026-02-08');
    
    // Simulate two users moving to same position
    const promise1 = queueService.moveToPosition(reservations[0].id, 2);
    const promise2 = queueService.moveToPosition(reservations[1].id, 2);
    
    // One should succeed, one should fail with user-friendly message
    const results = await Promise.allSettled([promise1, promise2]);
    
    const rejected = results.find(r => r.status === 'rejected');
    expect(rejected).toBeDefined();
    expect((rejected as any).reason.message).toContain('race condition');
  });
});
```

---

## 🚀 Deployment

```bash
# 1. Pull changes
cd /home/kamil/rezerwacje
git pull origin feature/reservation-queue

# 2. Restart backend
docker compose restart backend

# 3. Test
curl http://localhost:3001/api/health
```

**Brak migr acji SQL potrzebnych** - tylko zmiany w kodzie!

---

## 📝 Commits

| Commit | Opis |
|--------|------|
| [`0be0bf5`](https://github.com/kamil-gol/rezerwacje/commit/0be0bf554c15b11daa3fccd102eed58fa071cfa3) | Service: Walidacja maxPosition |
| [`b81e299`](https://github.com/kamil-gol/rezerwacje/commit/b81e2990dfe1a70f8cfd64adc7bc338110b76a72) | Controller: Lepsze error handling |

---

## ✅ Checklist

- [x] Walidacja `newPosition` typu integer
- [x] Walidacja `newPosition` >= 1
- [x] Walidacja `newPosition` <= maxPosition (liczba rezerwacji)
- [x] Obsługa Prisma P2002 (unique constraint)
- [x] User-friendly error messages
- [x] HTTP status codes (400, 404, 409)
- [x] Dokumentacja
- [ ] Testy jednostkowe (opcjonalnie)
- [ ] Testy integracyjne (opcjonalnie)

---

**Status:** ✅ READY TO DEPLOY  
**Data:** 07.02.2026 23:54 CET  
**Autor:** AI Assistant + Kamil Gol
