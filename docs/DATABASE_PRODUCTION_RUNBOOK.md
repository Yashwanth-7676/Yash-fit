# YashFit Database Production Runbook
**Version:** 1.0.0 (Production Release)  
**Database Engine:** PostgreSQL 16 on Supabase  
**Security Architecture:** Multi-Tenant Row Level Security (RLS) with Cryptographic JWT Isolation

---

## 1. Overview & Architecture

YashFit utilizes a multi-tenant PostgreSQL database hosted on Supabase. Every table containing user fitness metrics, personal biomarkers, nutrition logs, workout history, or custom programs is isolated using PostgreSQL Row Level Security (RLS) anchored to `auth.users(id)`.

- **Total Tables:** 55
- **RLS Status:** 100% of tables have Row Level Security enabled.
- **Tenant Isolation Key:** `auth.uid() = user_id`
- **Public Tables:** `exercise_library`, `indian_food_database` (read-only for all authenticated/anonymous users; write restricted to service role).

---

## 2. Production Migration Execution Protocol

### Rule #1: Zero Downtime & Non-Destructive Migrations
- **Never drop tables or columns** in production without a minimum 30-day deprecation cycle.
- All DDL statements must be idempotent using `IF NOT EXISTS` or conditional procedural blocks (`DO $$ BEGIN ... END $$;`).
- All foreign keys referencing `auth.users(id)` must specify `ON DELETE CASCADE` to honor account deletion requests.

### Execution Path A: Supabase Dashboard SQL Editor (Recommended for Initial Launch)
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your dedicated **Production Project**.
3. Open **SQL Editor** from the left navigation bar.
4. Click **New query**.
5. Copy the contents of [`supabase/schema.sql`](../supabase/schema.sql).
6. Click **Run** (`Ctrl+Enter` or `Cmd+Enter`).
7. Confirm that the query succeeds with zero errors.

### Execution Path B: Supabase CLI (Automated CI/CD Deployment)
For automated pipeline deployments using GitHub Actions:
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link your production project (requires SUPABASE_ACCESS_TOKEN and project ref)
supabase link --project-ref <your-production-project-ref>

# 3. Push schema migrations
supabase db push
```

---

## 3. RLS Verification & Security Audit Queries

Execute these verification queries in the Supabase SQL Editor after any migration to verify that no table is exposed:

### Audit 1: Verify All Tables Have RLS Enabled
```sql
SELECT 
    schemaname, 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false;
```
*Expected Result:* 0 rows returned. (If any table appears, execute `ALTER TABLE <tablename> ENABLE ROW LEVEL SECURITY;`).

### Audit 2: Verify RLS Policies per Table
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```
*Expected Result:* 87+ policies actively guarding SELECT, INSERT, UPDATE, and DELETE operations.

### Audit 3: Test Cross-Tenant Boundary
```sql
-- Simulate non-owner access (should return 0 rows)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}';

SELECT COUNT(*) FROM public.profiles 
WHERE user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
-- Must return 0
RESET ROLE;
```

---

## 4. Production Backup & Restoration Strategy

### A. Point-In-Time Recovery (PITR)
- For Supabase Pro/Team plans, **enable PITR** under **Project Settings > Database > Backups**.
- This enables continuous WAL (Write-Ahead Logging) archiving allowing restoration to any exact minute within the last 7 to 30 days.

### B. Automated Daily `pg_dump` Backup Script
For offsite, cold-storage redundancy (e.g. AWS S3, Cloudflare R2, or local storage), use this backup script:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/yashfit"
BACKUP_FILE="${BACKUP_DIR}/yashfit_prod_${TIMESTAMP}.dump"
DB_HOST="db.<your-project-ref>.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
DB_PORT="5432"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting YashFit production database backup..."

# pg_dump using custom binary format (compressed, supports parallel restore)
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"

# Optional: Upload to S3/R2
# aws s3 cp "${BACKUP_FILE}" "s3://yashfit-production-backups/daily/${TIMESTAMP}.dump"

# Retain local backups for 30 days
find "${BACKUP_DIR}" -name "yashfit_prod_*.dump" -mtime +30 -delete
```

### C. Database Restoration Runbook
In the event of a catastrophic disaster or corrupted migration:

```bash
# 1. Notify incident response team and enable maintenance mode
# 2. Restore from .dump file to a new target or staging database first:
pg_restore \
  -h "${TARGET_DB_HOST}" \
  -p 5432 \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "${BACKUP_FILE}"

# 3. Verify row counts and RLS status before repointing application DNS / environment variables
```

---

## 5. User Data Deletion & Privacy Compliance (GDPR / CCPA)

When a user requests account deletion via `/privacy-center` or `/data-deletion`:
1. The client or admin triggers `supabase.auth.admin.deleteUser(userId)`.
2. PostgreSQL cascades deletions automatically across all 55 child tables via `REFERENCES auth.users(id) ON DELETE CASCADE`.
3. Any orphaned telemetry in local caches is cleared via client-side `localStorage.clear()`.

