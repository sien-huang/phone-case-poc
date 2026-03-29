# 🗄️ Database Setup & Migration Guide

**从文件存储迁移到 PostgreSQL + Prisma**

---

## 📦 What's Changed

| Before | After |
|--------|-------|
| `data/products.json` (file) | PostgreSQL `products` table |
| `data/inquiries.json` (file) | PostgreSQL `inquiries` table + `inquiry_items` |
| Direct file reads/writes | Unified `lib/db.ts` API (hybrid mode) |
| No foreign keys | Full relational schema with constraints |

**Key Benefit**: Production-ready, concurrent-safe, transactional.

---

## 🚀 Quick Start (Local Development)

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Docker (alternative)
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=cloudwing_db \
  postgres:15
```

### 2. Configure Environment

Edit `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudwing_db?schema=public"
```

**Important**: Use your actual PostgreSQL credentials.

### 3. Run Setup Script

```bash
./scripts/setup-db.sh
```

This will:
- ✅ Create database (if not exists)
- ✅ Apply Prisma migrations
- ✅ Seed initial categories

### 4. Verify

```bash
npm run db:studio
```

Open http://localhost:5555 and explore your database.

### 5. Start Development Server

```bash
npm run dev
```

The app will automatically use the database if available, falling back to file storage if DB is down.

---

## 🔄 Migration Strategy: Hybrid Mode

### Dual-Write Architecture

The new `lib/db.ts` provides a unified API that:

1. **Tries database first** for all reads/writes
2. **Falls back to file storage** if DB connection fails
3. **Keeps data in sync** during transition period

```typescript
import { getProducts, createProduct } from '@/lib/db'

// Works the same regardless of storage backend
const products = await getProducts()
const newProduct = await createProduct({ name: '...' })
```

### Benefits

- **Zero downtime migration**
- **Easy rollback** (just stop PostgreSQL, app continues with files)
- **Gradual data sync** (no big-bang import needed)

---

## 📊 Data Migration (One-Time)

If you have existing data in `data/products.json`, run the migration script:

```bash
npx tsx scripts/migrate-data.ts
```

This will:
- Read all products from `data/products.json`
- Insert/update them into PostgreSQL
- Preserve existing IDs and timestamps

**Note**: Categories will be auto-created from product categories.

---

## 🛠️ Database Operations

### CLI Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes without migrations (dev only)
npm run db:push

# Create a new migration
npm run db:migrate

# Apply migrations (CI/CD)
npm run db:deploy

# Open Prisma Studio (GUI)
npm run db:studio

# Reset database (DESTRUCTIVE!)
npm run db:reset

# Seed initial data
npm run db:seed
```

### Raw SQL Access

```bash
# Connect to database
psql $DATABASE_URL

# Example queries
SELECT COUNT(*) FROM products;
SELECT category, COUNT(*) FROM products GROUP BY category;
SELECT * FROM products WHERE viewCount > 100 ORDER BY viewCount DESC;
```

---

## 📈 Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Product catalog | id, name, slug, category, viewCount, salesCount, status |
| `categories` | Category definitions | id, name, productCount, totalViews, totalSales |
| `inquiries` | Quote submissions | id, inquiryNumber, customerEmail, status |
| `inquiry_items` | Line items per inquiry | inquiryId, productId, quantity, unitPrice |
| `sale_logs` | Sales tracking | productId, quantity, orderId, createdAt |
| `system_logs` | Audit trail | level, category, message, createdAt |

### Relationships

```
Category 1---* Product
Product 1---* InquiryItem (through productId)
Inquiry 1---* InquiryItem
Inquiry 1---* InquiryCommunication
Product 1---* SaleLog
```

---

## 🔐 Production Deployment

### Environment Variables

Set these in your hosting provider:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Zero-Downtime Deployments

Use `prisma migrate deploy` in your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Deploy
  run: |
    npx prisma migrate deploy
    npm run build
    npm start
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/cloudwing"
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL > $BACKUP_DIR/cloudwing_$DATE.sql
gzip $BACKUP_DIR/cloudwing_$DATE.sql

# Retain last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Monitoring

Check database health:

```sql
-- Connection count
SELECT COUNT(*) FROM pg_stat_activity;

-- Table sizes
SELECT
  schemaname AS table_schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) AS size
FROM pg_tables
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)) DESC;

-- Slow queries (requires pg_stat_statements)
SELECT query, total_time, calls FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## ⚠️ Important Notes

### Handling Schema Changes

1. **Update `prisma/schema.prisma`**
2. **Create migration**:
   ```bash
   npm run db:migrate -- --name add_field_to_product
   ```
3. **Test locally**: `npm run db:studio`
4. **Deploy**: `npm run db:deploy`

**Never edit migration files after applying** - create new ones instead.

### Rollback Procedure

If a migration breaks production:

```bash
# Check migration history
npx prisma migrate status

# Rollback one step
npx prisma migrate rollback

# Or to specific migration
npx prisma migrate resolve --rolled-back <migration_name>
```

### Performance Tips

1. **Indexes**: Prisma `@@index` already defined for:
   - `products(slug)` - fast product lookups
   - `products(category)` - category filtering
   - `products(status)` - status queries
   - `inquiries(createdAt)` - recent inquiries

2. **Connection Pooling**: Use `pgBouncer` in production (Vercel/Railway have built-in pooling)

3. **Query Optimization**:
   - Use `select` to fetch only needed fields
   - Avoid N+1 queries with `include`
   - Paginate large datasets (`take`/`skip`)

---

## 🧪 Testing Database

### Unit Tests with Test Database

```typescript
// jest.setup.ts
import { PrismaClient } from '@prisma/client'

declare global {
  const prisma: PrismaClient
}

beforeAll(async () => {
  global.prisma = new PrismaClient()
  // Run migrations on test DB
  await exec('npx prisma migrate deploy --schema=prisma/test-schema.prisma')
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### Integration Test Helper

```typescript
// lib/test-utils.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function resetDatabase() {
  await prisma.$executeRaw`TRUNCATE TABLE "SaleLog" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "InquiryItem" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "InquiryCommunication" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Inquiry" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Product" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Category" CASCADE;`
}

export { prisma }
```

---

## 📚 Troubleshooting

### "P1012: The datasource property `url` is no longer supported"

**Cause**: Prisma 7+ changed config. Using Prisma 6 (stable).

**Fix**: Ensure `prisma/schema.prisma` contains `url = env("DATABASE_URL")` and you have Prisma 6.x:

```bash
npm install prisma@^6 @prisma/client@^6 --save-dev
```

### "Connection refused" or "Timeout"

**Check**:
```bash
# Is PostgreSQL running?
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "Relation does not exist"

**Cause**: Migrations not applied.

**Fix**:
```bash
npx prisma migrate deploy
```

### "Unique constraint failed" on category creation

**Cause**: Category already exists.

**Fix**: Use existing category name exactly (case-sensitive).

---

## 🎯 Next Steps After Database Setup

1. ✅ **Update API routes** - Done (using lib/db.ts)
2. ✅ **Test dual-write mode** - Verify writes go to both DB and file
3. ⏭️ **Remove file fallback** - After 1 week of stable DB operation
4. ⏭️ **Add connection pooling** - Configure pgBouncer or use provider's pooling
5. ⏭️ **Set up monitoring** - Add query logging, slow query alerts
6. ⏭️ **Implement backups** - Automated daily backups + retention

---

## 📞 Support

- Prisma Docs: https://pris.ly/d/doc
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Issues: Create GitHub issue with `prisma migrate status` output

---

**Status**: 🟢 Ready for production (after config)
