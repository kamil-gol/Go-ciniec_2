# Changelog - Reservation Queue System

## [Unreleased] - Branch: `feature/reservation-queue`

### ➕ Added

#### Database Schema
- **Enum `ReservationStatus`** with values: `RESERVED`, `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- **Column `reservationQueuePosition`** (SMALLINT, nullable) - Position in queue (1, 2, 3...)
- **Column `reservationQueueDate`** (TIMESTAMP, nullable) - Date the reservation is queued for
- **Column `queueOrderManual`** (BOOLEAN, default false) - Flag for manual ordering
- **Indexes** on `reservationQueueDate`, `reservationQueuePosition`, `queueOrderManual`

#### Database Functions
- **`recalculate_queue_positions(date, exclude_id)`** - Recalculates positions for automatic ordering
- **`swap_queue_positions(id1, id2)`** - Swaps two reservations' positions
- **`move_to_queue_position(id, position)`** - Moves reservation to specific position
- **`auto_cancel_expired_reserved()`** - Cancels RESERVED reservations past their date

#### Database Triggers
- **`recalculate_queue_on_status_change`** - Auto-recalculates positions when status changes from RESERVED

#### Documentation
- `README.md` - Comprehensive feature documentation with examples
- `HOWTO.md` - Step-by-step migration and cron setup instructions
- `SUMMARY.md` - Quick overview and implementation checklist
- `test_migration.sql` - Automated tests for database changes
- `auto_cancel_expired_reserved.sql` - Cron script for auto-cancellation

### 🔄 Changed

#### Database Schema
- **Column `status`** - Changed from VARCHAR(20) to enum `ReservationStatus`
- **Columns `hallId`, `eventTypeId`, `startDateTime`, `endDateTime`** - Now nullable (required only after RESERVED promotion)

#### Migration Path
- Existing reservations migrated to new enum values
- All existing reservations keep their current status
- No data loss during migration

### 🐛 Fixed
- N/A (new feature)

### 🛑 Deprecated
- N/A

### 🚨 Breaking Changes

#### Backend
1. **Type changes required:**
   ```typescript
   // Old
   status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
   
   // New
   status: 'RESERVED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
   ```

2. **Validation logic changes:**
   - Fields `hallId`, `eventTypeId`, `startDateTime`, `endDateTime` are now optional
   - Must validate based on status before saving
   - Must check hall availability only when promoting from RESERVED

3. **New API endpoints needed:**
   - `POST /api/reservations/reserved` - Create RESERVED reservation
   - `GET /api/reservations/queue/:date` - Get queue for date
   - `POST /api/reservations/queue/swap` - Swap positions
   - `PUT /api/reservations/:id/promote` - Promote RESERVED to PENDING

#### Frontend
1. **New forms required:**
   - Simplified form for RESERVED status (date + guests only)
   - Full form modal for promotion to PENDING

2. **New views required:**
   - Queue list view (with drag-and-drop)
   - Queue calendar
   - Queue statistics widget

3. **Status badge updates:**
   - Add new "RESERVED" status color/icon
   - Show queue position for RESERVED items

### 📝 Migration Notes

#### Database Migration
```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

#### Cron Setup (Choose one)

**Option A: Node-cron (Recommended)**
```bash
cd apps/backend
npm install node-cron @types/node-cron
# Then add cron job in code (see HOWTO.md)
```

**Option B: System Cron**
```bash
crontab -e
# Add: 1 0 * * * /path/to/script.sh
```

**Option C: Docker Ofelia**
```yaml
# Add scheduler service to docker-compose.yml
```

### ✅ Testing

#### Automated Tests
```bash
# Run database tests
psql -d rezerwacje -f test_migration.sql
```

#### Manual Tests
1. Create RESERVED reservation
2. Verify queue position assignment
3. Cancel one reservation and verify recalculation
4. Manually swap positions
5. Promote RESERVED to PENDING with validation
6. Test auto-cancellation function

### 📊 Performance Impact

- **Indexes added** for efficient queue queries
- **Trigger overhead** minimal (only fires on status change)
- **Function performance** O(n) where n = reservations per day (typically < 20)

### 🔐 Security Considerations

- All functions use parameterized queries (SQL injection safe)
- Validation required at API level for promotion
- Manual reordering should require admin/manager role

### 🚫 Known Limitations

1. **Mixed manual/automatic ordering** - Once any reservation is manually ordered, automatic recalculation skips it
2. **Concurrent updates** - Race condition possible if two admins swap positions simultaneously (use transactions)
3. **Queue gaps** - If manual positions create gaps (1, 2, 5), they persist until recalculation

### 📦 Dependencies

- PostgreSQL 12+ (for `gen_random_uuid()` support)
- Prisma 5.x
- Node.js 18+ (for backend cron)
- Optional: node-cron for auto-cancellation

### 📚 References

- [README.md](./apps/backend/prisma/migrations/20260207_add_reservation_queue_system/README.md) - Full documentation
- [HOWTO.md](./apps/backend/prisma/migrations/20260207_add_reservation_queue_system/HOWTO.md) - Installation guide
- [SUMMARY.md](./apps/backend/prisma/migrations/20260207_add_reservation_queue_system/SUMMARY.md) - Quick reference

---

## Implementation Plan

### Phase 1: Database ✅ COMPLETE
- [x] Schema updates
- [x] Migration SQL
- [x] Functions and triggers
- [x] Auto-cancel script
- [x] Tests
- [x] Documentation

### Phase 2: Backend API ⏳ TODO
- [ ] Create RESERVED endpoint
- [ ] Queue management endpoints
- [ ] Promotion endpoint with validation
- [ ] Queue statistics endpoint
- [ ] Cron job setup
- [ ] Unit tests
- [ ] Integration tests

### Phase 3: Frontend ⏳ TODO
- [ ] RESERVED form component
- [ ] Queue list view
- [ ] Queue calendar
- [ ] Promotion modal
- [ ] Drag-and-drop reordering
- [ ] Status badges
- [ ] Queue statistics widget

### Phase 4: Testing ⏳ TODO
- [ ] E2E tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Load testing (concurrent queue updates)

### Phase 5: Deployment ⏳ TODO
- [ ] Staging deployment
- [ ] Production migration
- [ ] Cron setup on server
- [ ] Monitoring setup
- [ ] User training

---

**Branch Status:** 🟡 Ready for Backend Implementation  
**Last Updated:** 2026-02-07  
**Author:** Kamil Gołębiowski
