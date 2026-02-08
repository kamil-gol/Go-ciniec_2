# Queue Management API Documentation

RESTful API endpoints for managing reservation queues.

## Base URL

```
http://localhost:3001/api/queue
```

## Authentication

All endpoints require authentication using JWT token:

```
Authorization: Bearer <token>
```

**Required Role:** `ADMIN` or `EMPLOYEE` (Staff)

---

## Endpoints

### 1. Add to Queue (Create RESERVED)

Create a new RESERVED reservation in the queue.

**Endpoint:** `POST /api/queue/reserved`

**Request Body:**

```json
{
  "clientId": "uuid",
  "reservationQueueDate": "2026-03-15T00:00:00Z",
  "guests": 30,
  "adults": 25,
  "children": 5,
  "toddlers": 0,
  "notes": "Rezerwacja wstępna na komórkę"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "position": 3,
    "queueDate": "2026-03-15T00:00:00.000Z",
    "guests": 30,
    "client": {
      "id": "uuid",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "phone": "+48123456789",
      "email": "jan@example.com"
    },
    "isManualOrder": false,
    "notes": "Rezerwacja wstępna na komórkę",
    "createdAt": "2026-02-07T15:00:00.000Z",
    "createdBy": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User"
    }
  },
  "message": "Dodano do kolejki na pozycję #3"
}
```

---

### 2. Get Queue for Date

Get all RESERVED reservations for a specific date.

**Endpoint:** `GET /api/queue/:date`

**Parameters:**
- `date` (path) - Date in format `YYYY-MM-DD` or ISO string

**Example:**

```bash
GET /api/queue/2026-03-15
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "position": 1,
      "queueDate": "2026-03-15T00:00:00.000Z",
      "guests": 40,
      "client": { /* ... */ },
      "isManualOrder": false,
      "createdAt": "2026-02-01T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "position": 2,
      "queueDate": "2026-03-15T00:00:00.000Z",
      "guests": 25,
      "client": { /* ... */ },
      "isManualOrder": true,
      "createdAt": "2026-02-05T14:20:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 3. Get All Queues

Get all RESERVED reservations across all dates.

**Endpoint:** `GET /api/queue`

**Response:**

```json
{
  "success": true,
  "data": [
    /* Array of queue items sorted by date and position */
  ],
  "count": 15
}
```

---

### 4. Swap Queue Positions

Swap two reservations' positions in the queue.

**Endpoint:** `POST /api/queue/swap`

**Request Body:**

```json
{
  "reservationId1": "uuid-1",
  "reservationId2": "uuid-2"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Pozycje zostały zamienione"
}
```

**Notes:**
- Both reservations must be RESERVED
- Both must be on the same date
- After swap, both will be marked as `queueOrderManual: true`

---

### 5. Move to Position

Move a reservation to a specific position.

**Endpoint:** `PUT /api/queue/:id/position`

**Parameters:**
- `id` (path) - Reservation ID

**Request Body:**

```json
{
  "newPosition": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Przeniesiono na pozycję #1"
}
```

**Notes:**
- Reservation must be RESERVED
- Other reservations will be shifted up/down
- All affected reservations will be marked as `queueOrderManual: true`

---

### 6. Promote Reservation

Promote RESERVED reservation to PENDING or CONFIRMED.

**Endpoint:** `PUT /api/queue/:id/promote`

**Parameters:**
- `id` (path) - Reservation ID

**Request Body:**

```json
{
  "hallId": "uuid",
  "eventTypeId": "uuid",
  "startDateTime": "2026-03-15T18:00:00Z",
  "endDateTime": "2026-03-15T23:00:00Z",
  "adults": 25,
  "children": 5,
  "toddlers": 0,
  "pricePerAdult": 150.00,
  "pricePerChild": 75.00,
  "pricePerToddler": 0,
  "status": "PENDING",
  "notes": "Awansowano z listy rezerwowej",
  "customEventType": null,
  "birthdayAge": null,
  "anniversaryYear": null,
  "anniversaryOccasion": null
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    /* Full reservation object with hall, eventType, etc. */
  },
  "message": "Rezerwacja awansowana pomyślnie"
}
```

**Validations:**
- Reservation must be RESERVED
- Hall must be available for the time slot
- All required fields must be provided
- Prices and guest counts must be valid

**Auto-actions:**
- Queue positions recalculated automatically (trigger)
- Other RESERVED reservations moved up

---

### 7. Get Queue Statistics

Get statistics about current queues.

**Endpoint:** `GET /api/queue/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalQueued": 15,
    "queuesByDate": [
      {
        "date": "2026-03-15",
        "count": 3,
        "totalGuests": 85
      },
      {
        "date": "2026-04-10",
        "count": 2,
        "totalGuests": 50
      }
    ],
    "oldestQueueDate": "2026-03-15T00:00:00.000Z",
    "manualOrderCount": 5
  }
}
```

---

### 8. Auto-Cancel Expired

Manually trigger auto-cancellation of expired RESERVED reservations.

**Endpoint:** `POST /api/queue/auto-cancel`

**Request Body:** (none)

**Response:**

```json
{
  "success": true,
  "data": {
    "cancelledCount": 2,
    "cancelledIds": ["uuid-1", "uuid-2"]
  },
  "message": "Anulowano 2 przeterminowanych rezerwacji"
}
```

**Notes:**
- Cancels RESERVED where `reservationQueueDate` <= today
- Automatically runs daily at 00:01 AM via cron
- Adds note to cancelled reservations
- Logs to ReservationHistory

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "User not authenticated"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Reservation not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Queue Workflow

### Creating RESERVED

1. User fills minimal form (date, guests, client)
2. `POST /api/queue/reserved`
3. System assigns next position automatically
4. Response includes position number

### Manual Ordering

1. Admin views queue: `GET /api/queue/2026-03-15`
2. Admin swaps or moves reservations
3. System marks as `queueOrderManual: true`
4. These won't be auto-recalculated

### Promotion

1. Admin selects RESERVED reservation
2. Fills full form (hall, times, prices)
3. `PUT /api/queue/:id/promote`
4. System validates and promotes
5. Trigger auto-recalculates remaining queue

### Auto-Cancellation

1. Cron runs daily at 00:01 AM
2. Calls `auto_cancel_expired_reserved()` SQL function
3. Cancels RESERVED past their date
4. Logs results

---

## Testing with cURL

### Add to queue

```bash
curl -X POST http://localhost:3001/api/queue/reserved \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-uuid",
    "reservationQueueDate": "2026-03-15",
    "guests": 30,
    "adults": 30
  }'
```

### Get queue

```bash
curl http://localhost:3001/api/queue/2026-03-15 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Swap positions

```bash
curl -X POST http://localhost:3001/api/queue/swap \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId1": "uuid-1",
    "reservationId2": "uuid-2"
  }'
```

### Promote

```bash
curl -X PUT http://localhost:3001/api/queue/RESERVATION_ID/promote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "hall-uuid",
    "eventTypeId": "event-uuid",
    "startDateTime": "2026-03-15T18:00:00Z",
    "endDateTime": "2026-03-15T23:00:00Z",
    "adults": 30,
    "pricePerAdult": 150,
    "status": "PENDING"
  }'
```

---

## Frontend Integration

See frontend documentation for:
- Queue list component
- Drag-and-drop reordering
- Promotion modal
- Queue calendar view

---

## Database Functions Used

- `recalculate_queue_positions(date, exclude_id)` - Auto-recalculate
- `swap_queue_positions(id1, id2)` - Swap two reservations
- `move_to_queue_position(id, position)` - Move to specific position
- `auto_cancel_expired_reserved()` - Cancel expired RESERVED
- `trigger_recalculate_queue_on_status_change()` - Auto-trigger on status change

---

## Cron Schedule

```typescript
cron.schedule('1 0 * * *', async () => {
  // Runs daily at 00:01 AM
  await queueService.autoCancelExpired();
});
```

**To disable cron:** Comment out `setupAutoCancelCron()` in `server.ts`

---

## See Also

- [Migration README](../../../prisma/migrations/20260207_add_reservation_queue_system/README.md)
- [HOWTO Guide](../../../prisma/migrations/20260207_add_reservation_queue_system/HOWTO.md)
- [System Summary](../../../prisma/migrations/20260207_add_reservation_queue_system/SUMMARY.md)
