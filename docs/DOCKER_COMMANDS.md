# 🐳 Docker Commands - Migrations & Seed

**Project:** Go-ciniec_2  
**Created:** 2026-02-09  
**Environment:** Docker Compose

---

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Migration Commands](#migration-commands)
3. [Seed Commands](#seed-commands)
4. [Database Commands](#database-commands)
5. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Reference

### Common Operations

```bash
# Start all containers
docker compose up -d

# Run migration
docker compose exec backend npx prisma migrate dev

# Run seed
docker compose exec backend npm run seed

# View logs
docker compose logs -f backend

# Stop all containers
docker compose down
```

---

## 🔄 Migration Commands

### 1. Generate Prisma Client

```bash
# Generate Prisma Client (after schema changes)
docker compose exec backend npx prisma generate
```

**When to use:** After updating `schema.prisma`

### 2. Create New Migration

```bash
# Create migration from schema changes
docker compose exec backend npx prisma migrate dev --name migration_name

# Example: Menu system migration
docker compose exec backend npx prisma migrate dev --name menu_system
```

**What happens:**
1. Compares `schema.prisma` with database
2. Generates SQL migration file
3. Applies migration to database
4. Regenerates Prisma Client

### 3. Apply Existing Migrations

```bash
# Apply all pending migrations (development)
docker compose exec backend npx prisma migrate dev

# Apply migrations (production - no prompts)
docker compose exec backend npx prisma migrate deploy
```

### 4. Reset Database (⚠️ DESTRUCTIVE)

```bash
# Drop database, recreate, apply all migrations
docker compose exec backend npx prisma migrate reset

# Reset and run seed
docker compose exec backend npx prisma migrate reset --skip-seed
```

**Warning:** This deletes ALL data!

### 5. Check Migration Status

```bash
# View migration status
docker compose exec backend npx prisma migrate status
```

---

## 🌱 Seed Commands

### 1. Run All Seeds

```bash
# Run seed script defined in package.json
docker compose exec backend npm run seed
```

### 2. Run Specific Seed File

```bash
# Run menu seed only
docker compose exec backend npx ts-node prisma/seeds/menu.seed.ts

# Run base seed (users, halls, event types)
docker compose exec backend npx ts-node prisma/seeds/base.seed.ts
```

### 3. Check Seed Data

```bash
# Open Prisma Studio in Docker
docker compose exec backend npx prisma studio

# Then open: http://localhost:5555
```

---

## 🗄️ Database Commands

### 1. Connect to PostgreSQL

```bash
# Connect to database container
docker compose exec postgres psql -U rezerwacje -d rezerwacje
```

**Inside psql:**
```sql
-- List tables
\dt

-- Describe table
\d "MenuTemplate"

-- Count rows
SELECT COUNT(*) FROM "MenuTemplate";

-- Exit
\q
```

### 2. Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U rezerwacje -d rezerwacje > backup_$(date +%Y%m%d_%H%M%S).sql

# Create backup (compressed)
docker compose exec postgres pg_dump -U rezerwacje -d rezerwacje | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 3. Database Restore

```bash
# Restore from backup
docker compose exec -T postgres psql -U rezerwacje -d rezerwacje < backup_20260209_235959.sql

# Restore from compressed backup
gunzip -c backup_20260209_235959.sql.gz | docker compose exec -T postgres psql -U rezerwacje -d rezerwacje
```

### 4. View Database Logs

```bash
# View PostgreSQL logs
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100 postgres
```

---

## 🚀 Complete Workflow (Menu System)

### Initial Setup

```bash
# 1. Start containers
docker compose up -d

# 2. Wait for database to be ready
docker compose logs -f postgres
# (Wait for "database system is ready to accept connections")

# 3. Generate Prisma Client
docker compose exec backend npx prisma generate

# 4. Apply all migrations
docker compose exec backend npx prisma migrate dev

# 5. Run seed data
docker compose exec backend npm run seed

# 6. Verify data in Prisma Studio
docker compose exec backend npx prisma studio
# Open: http://localhost:5555
```

### After Schema Changes

```bash
# 1. Edit schema.prisma
vim apps/backend/prisma/schema.prisma

# 2. Generate Prisma Client
docker compose exec backend npx prisma generate

# 3. Create migration
docker compose exec backend npx prisma migrate dev --name your_migration_name

# 4. Run seed (if needed)
docker compose exec backend npm run seed
```

### Menu System Migration (Current)

```bash
# 1. Ensure containers are running
docker compose ps

# 2. Generate Prisma Client (schema already updated)
docker compose exec backend npx prisma generate

# 3. Apply menu migration
docker compose exec backend npx prisma migrate dev --name menu_system

# 4. Run menu seed
docker compose exec backend npx ts-node prisma/seeds/menu.seed.ts

# 5. Verify in Prisma Studio
docker compose exec backend npx prisma studio
# Check tables:
# - MenuTemplate (3 rows)
# - MenuPackage (7 rows)
# - MenuOption (33 rows)
# - MenuPackageOption (~60 rows)
```

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Wait for health check
docker compose ps postgres
# (Status should be "healthy")
```

### Problem: "Migration failed"

**Solution:**
```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Mark failed migration as rolled back
docker compose exec backend npx prisma migrate resolve --rolled-back migration_name

# Try migration again
docker compose exec backend npx prisma migrate dev
```

### Problem: "Prisma Client out of sync"

**Solution:**
```bash
# Regenerate Prisma Client
docker compose exec backend npx prisma generate

# Restart backend container
docker compose restart backend
```

### Problem: "Seed fails with foreign key error"

**Solution:**
```bash
# Check if base data exists
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) FROM \"EventType\";"

# If 0, run base seed first
docker compose exec backend npx ts-node prisma/seeds/base.seed.ts

# Then run menu seed
docker compose exec backend npx ts-node prisma/seeds/menu.seed.ts
```

### Problem: "Port 5432 already in use"

**Solution:**
```bash
# Stop local PostgreSQL
sudo systemctl stop postgresql

# Or change port in docker-compose.yml
# ports:
#   - '5433:5432'  # Use 5433 externally
```

### Problem: "Container keeps restarting"

**Solution:**
```bash
# View container logs
docker compose logs -f backend

# Check for syntax errors in code
docker compose exec backend npm run build

# Restart with fresh state
docker compose down
docker compose up -d
```

---

## 📊 Database Inspection Commands

### Quick Queries

```bash
# Count all menu templates
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) FROM \"MenuTemplate\";"

# List all packages
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT id, name, \"pricePerAdult\" FROM \"MenuPackage\";"

# List all options
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT id, name, category, \"priceType\" FROM \"MenuOption\";"

# Count package options
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) FROM \"MenuPackageOption\";"
```

### Schema Inspection

```bash
# List all tables
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "\\dt"

# Describe MenuTemplate table
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "\\d \"MenuTemplate\""

# List indexes
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "\\di"

# List foreign keys
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'Menu%';
"
```

---

## 🎯 Best Practices

### 1. Always Use Named Migrations

```bash
# ❌ Bad (auto-generated name)
docker compose exec backend npx prisma migrate dev

# ✅ Good (descriptive name)
docker compose exec backend npx prisma migrate dev --name add_menu_system
```

### 2. Backup Before Major Changes

```bash
# Create backup before migration
docker compose exec postgres pg_dump -U rezerwacje -d rezerwacje | gzip > backup_before_menu_migration_$(date +%Y%m%d_%H%M%S).sql.gz

# Run migration
docker compose exec backend npx prisma migrate dev --name menu_system
```

### 3. Test Seeds in Development First

```bash
# Run seed in dev environment
docker compose exec backend npm run seed

# Verify data
docker compose exec backend npx prisma studio

# If OK, then apply to staging/production
```

### 4. Use Environment Variables

```bash
# Development (with prompts)
docker compose exec backend npx prisma migrate dev

# Production (no prompts, non-destructive)
docker compose exec backend npx prisma migrate deploy
```

### 5. Check Migration Status Before Applying

```bash
# Always check status first
docker compose exec backend npx prisma migrate status

# Then apply if needed
docker compose exec backend npx prisma migrate deploy
```

---

## 📝 Quick Command Cheatsheet

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Container Management
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose up -d              # Start all containers
docker compose down               # Stop all containers
docker compose ps                 # List containers
docker compose logs -f backend    # Follow backend logs
docker compose restart backend    # Restart backend

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Prisma Commands
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose exec backend npx prisma generate         # Generate client
docker compose exec backend npx prisma migrate dev      # Create & apply migration
docker compose exec backend npx prisma migrate deploy   # Apply migrations (prod)
docker compose exec backend npx prisma migrate status   # Check status
docker compose exec backend npx prisma migrate reset    # Reset DB (⚠️ DESTRUCTIVE)
docker compose exec backend npx prisma studio           # Open Prisma Studio

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Seed Commands
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose exec backend npm run seed                          # Run all seeds
docker compose exec backend npx ts-node prisma/seeds/menu.seed.ts # Run menu seed
docker compose exec backend npx ts-node prisma/seeds/base.seed.ts # Run base seed

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Database Commands
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose exec postgres psql -U rezerwacje -d rezerwacje    # Connect to DB
docker compose exec postgres pg_dump -U rezerwacje -d rezerwacje > backup.sql  # Backup
docker compose exec -T postgres psql -U rezerwacje -d rezerwacje < backup.sql  # Restore

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Inspection Commands
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "\\dt"  # List tables
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) FROM \"MenuTemplate\";"  # Count rows
```

---

## 🔐 Environment Variables

```bash
# Database credentials (from docker-compose.yml)
DB_USER=rezerwacje
DB_PASSWORD=rezerwacje_secure_pass_2026
DB_NAME=rezerwacje
DB_PORT=5432

# To override, create .env file:
DB_USER=custom_user
DB_PASSWORD=custom_pass
DB_NAME=custom_db
```

---

## 📚 Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated:** 2026-02-09  
**Project:** Go-ciniec_2 - System Rezerwacji Sal  
**Author:** Kamil Gołębiowski
