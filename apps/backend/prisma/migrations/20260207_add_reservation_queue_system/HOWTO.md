# How to Run This Migration

## 📝 Prerequisites

- [ ] PostgreSQL database is running
- [ ] You have backed up the database
- [ ] You're on branch `feature/reservation-queue`
- [ ] Docker containers are running

---

## 🚀 Step-by-Step Instructions

### Option 1: Automatic Migration (Recommended)

#### 1. Pull the latest changes

```bash
cd /home/kamil/rezerwacje
git fetch origin
git checkout feature/reservation-queue
git pull origin feature/reservation-queue
```

#### 2. Run Prisma migration

```bash
cd apps/backend

# Generate Prisma Client with new types
npx prisma generate

# Apply migration to database
npx prisma migrate deploy

# Or for development with interactive prompts:
npx prisma migrate dev
```

#### 3. Verify migration

```bash
# Check migration status
npx prisma migrate status

# Should show:
# ✓ Migration 20260207_add_reservation_queue_system applied
```

#### 4. Test functions

```bash
# Run test script
docker-compose exec db psql -U postgres -d rezerwacje \
  -f /docker-entrypoint-initdb.d/migrations/20260207_add_reservation_queue_system/test_migration.sql

# Or from host:
psql -h localhost -U postgres -d rezerwacje \
  -f apps/backend/prisma/migrations/20260207_add_reservation_queue_system/test_migration.sql
```

#### 5. Restart backend

```bash
cd /home/kamil/rezerwacje
docker-compose restart backend

# Check logs
docker-compose logs -f backend
```

---

### Option 2: Manual Migration (If automatic fails)

#### 1. Connect to PostgreSQL

```bash
# Get database credentials from .env
cat apps/backend/.env | grep DATABASE_URL

# Connect using psql
docker-compose exec db psql -U postgres -d rezerwacje
```

#### 2. Run migration SQL

```bash
# Copy migration file to container
docker cp apps/backend/prisma/migrations/20260207_add_reservation_queue_system/migration.sql \
  $(docker-compose ps -q db):/tmp/

# Execute migration
docker-compose exec db psql -U postgres -d rezerwacje -f /tmp/migration.sql
```

#### 3. Verify

```bash
# Copy and run test script
docker cp apps/backend/prisma/migrations/20260207_add_reservation_queue_system/test_migration.sql \
  $(docker-compose ps -q db):/tmp/

docker-compose exec db psql -U postgres -d rezerwacje -f /tmp/test_migration.sql
```

#### 4. Update Prisma

```bash
cd apps/backend
npx prisma generate
```

---

## 🔄 Setup Auto-Cancellation (Cron)

RESERVED reservations should auto-cancel on their event date.

### Option A: Node-Cron (Backend)

**Recommended** - Add to backend code:

```typescript
// apps/backend/src/cron/cancelExpiredReserved.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupAutoCancelCron() {
  // Run every day at 00:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('[CRON] Running auto-cancel for expired RESERVED...');
    
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM auto_cancel_expired_reserved()
      `;
      
      console.log('[CRON] Auto-cancel completed:', result);
    } catch (error) {
      console.error('[CRON] Auto-cancel failed:', error);
    }
  });
  
  console.log('[CRON] Auto-cancel scheduled for 00:01 AM daily');
}
```

**Enable in app:**

```typescript
// apps/backend/src/index.ts
import { setupAutoCancelCron } from './cron/cancelExpiredReserved';

// After server starts
setupAutoCancelCron();
```

**Install dependency:**

```bash
cd apps/backend
npm install node-cron
npm install --save-dev @types/node-cron
```

---

### Option B: System Cron (Linux)

#### 1. Create wrapper script

```bash
sudo nano /usr/local/bin/cancel-expired-reserved.sh
```

**Content:**

```bash
#!/bin/bash

LOG_FILE="/var/log/rezerwacje/auto-cancel-reserved.log"
MIGRATION_DIR="/home/kamil/rezerwacje/apps/backend/prisma/migrations/20260207_add_reservation_queue_system"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting auto-cancel..." >> $LOG_FILE

cd /home/kamil/rezerwacje

docker-compose exec -T db psql -U postgres -d rezerwacje \
  -f /docker-entrypoint-initdb.d/migrations/20260207_add_reservation_queue_system/auto_cancel_expired_reserved.sql \
  >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-cancel completed successfully" >> $LOG_FILE
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-cancel FAILED" >> $LOG_FILE
fi
```

#### 2. Make executable

```bash
sudo chmod +x /usr/local/bin/cancel-expired-reserved.sh
```

#### 3. Create log directory

```bash
sudo mkdir -p /var/log/rezerwacje
sudo chown $USER:$USER /var/log/rezerwacje
```

#### 4. Add to crontab

```bash
crontab -e
```

**Add line:**

```cron
# Auto-cancel expired RESERVED reservations daily at 00:01 AM
1 0 * * * /usr/local/bin/cancel-expired-reserved.sh
```

#### 5. Verify cron

```bash
# List cron jobs
crontab -l

# Test script manually
/usr/local/bin/cancel-expired-reserved.sh

# Check logs
tail -f /var/log/rezerwacje/auto-cancel-reserved.log
```

---

### Option C: Docker Compose with Ofelia

**Add to docker-compose.yml:**

```yaml
services:
  # ... existing services
  
  scheduler:
    image: mcuadros/ofelia:latest
    depends_on:
      - db
    command: daemon --docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      ofelia.job-exec.cancel-expired.schedule: "0 1 0 * * *"  # 00:01 daily
      ofelia.job-exec.cancel-expired.container: "rezerwacje_db_1"
      ofelia.job-exec.cancel-expired.command: >
        psql -U postgres -d rezerwacje -c 
        "SELECT * FROM auto_cancel_expired_reserved()"
```

**Start scheduler:**

```bash
docker-compose up -d scheduler
```

---

## ✅ Verification Checklist

### Database Level

```sql
-- 1. Enum exists
SELECT typname FROM pg_type WHERE typname = 'ReservationStatus';
-- ✅ Should return: ReservationStatus

-- 2. New columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Reservation' 
  AND column_name IN (
    'reservationQueuePosition', 
    'reservationQueueDate',
    'queueOrderManual'
  );
-- ✅ Should return 3 columns

-- 3. Functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'recalculate_queue_positions',
  'swap_queue_positions',
  'move_to_queue_position',
  'auto_cancel_expired_reserved'
);
-- ✅ Should return 4 functions

-- 4. Trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'recalculate_queue_on_status_change';
-- ✅ Should return 1 trigger

-- 5. Test recalculation (safe - no data change)
SELECT recalculate_queue_positions('2099-12-31'::TIMESTAMP);
-- ✅ Should execute without error
```

### Application Level

```bash
# 1. TypeScript compilation
cd apps/backend
npm run build
# ✅ Should compile without errors

# 2. Backend starts
docker-compose restart backend
docker-compose logs backend | grep "Server running"
# ✅ Should see: "Server running on port 4000"

# 3. Frontend compiles
cd apps/frontend
npm run build
# ✅ Should compile without errors

# 4. Test auto-cancel manually
docker-compose exec db psql -U postgres -d rezerwacje \
  -c "SELECT * FROM auto_cancel_expired_reserved();"
# ✅ Should return: (0, {}) if no expired reservations
```

---

## 🐛 Troubleshooting

### Error: "type 'ReservationStatus' already exists"

```sql
-- Drop existing type first
DROP TYPE IF EXISTS "ReservationStatus" CASCADE;

-- Then re-run migration
```

### Error: "function recalculate_queue_positions does not exist"

```bash
# Re-run migration.sql
docker-compose exec db psql -U postgres -d rezerwacje \
  -f /path/to/migration.sql
```

### Error: "trigger already exists"

```sql
-- Drop and recreate
DROP TRIGGER IF EXISTS recalculate_queue_on_status_change ON "Reservation";
-- Then re-run migration
```

### Cron not running

```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Test script manually
/usr/local/bin/cancel-expired-reserved.sh
```

### Manual testing of functions

```sql
-- Test swap (use real IDs)
BEGIN;
SELECT swap_queue_positions(
  'uuid-1'::UUID,
  'uuid-2'::UUID
);
ROLLBACK;  -- Undo for testing

-- Test move
BEGIN;
SELECT move_to_queue_position('uuid'::UUID, 1);
ROLLBACK;

-- Test auto-cancel (safe - only affects past dates)
SELECT * FROM auto_cancel_expired_reserved();
```

---

## 🔙 Rollback

If you need to rollback:

```bash
# 1. Stop backend
docker-compose stop backend

# 2. Revert migration
cd apps/backend
npx prisma migrate resolve --rolled-back 20260207_add_reservation_queue_system

# 3. Manual SQL rollback
docker-compose exec db psql -U postgres -d rezerwacje
```

**SQL rollback:**

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS recalculate_queue_on_status_change ON "Reservation";

-- Drop functions
DROP FUNCTION IF EXISTS trigger_recalculate_queue_on_status_change();
DROP FUNCTION IF EXISTS recalculate_queue_positions(TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS swap_queue_positions(UUID, UUID);
DROP FUNCTION IF EXISTS move_to_queue_position(UUID, INTEGER);
DROP FUNCTION IF EXISTS auto_cancel_expired_reserved();

-- Revert status to VARCHAR
ALTER TABLE "Reservation" ADD COLUMN "status_old" VARCHAR(20);
UPDATE "Reservation" SET "status_old" = "status"::text;
ALTER TABLE "Reservation" DROP COLUMN "status";
ALTER TABLE "Reservation" RENAME COLUMN "status_old" TO "status";

-- Drop queue columns
ALTER TABLE "Reservation" 
  DROP COLUMN "reservationQueuePosition",
  DROP COLUMN "reservationQueueDate",
  DROP COLUMN "queueOrderManual";

-- Drop enum
DROP TYPE "ReservationStatus";
```

**Remove cron:**

```bash
# Remove from crontab
crontab -e
# Delete the line with cancel-expired-reserved.sh

# Or remove from backend code
# Comment out setupAutoCancelCron() call
```

---

## 📞 Support

If you encounter issues:

1. Check [README.md](./README.md) for detailed documentation
2. Run [test_migration.sql](./test_migration.sql) for diagnostics
3. Check Docker logs: `docker-compose logs -f backend db`
4. Verify database connection: `docker-compose exec db psql -U postgres -d rezerwacje -c '\dt'`
5. Test functions manually (see Troubleshooting section)

---

## ✅ Success!

If all checks pass, migration is complete! 🎉

**Next steps:**

1. ✅ **Backend API** - Implement endpoints for queue management
2. ✅ **Frontend** - Build UI for RESERVED status and queue views
3. ✅ **Validation** - Add promotion validation logic
4. ✅ **Cron** - Choose and setup auto-cancellation method
5. ✅ **Testing** - Test queue workflows end-to-end
