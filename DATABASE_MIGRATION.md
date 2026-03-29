# 🗄️ Database Migration Guide

**From**: File-based JSON storage (`data/products.json`, `data/inquiries.json`)  
**To**: PostgreSQL + Prisma ORM

---

## 📋 Prerequisites

1. **PostgreSQL** installed (v14+)
   ```bash
   # Mac
   brew install postgresql@15

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # Docker (alternative)
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
   ```

2. **Prisma CLI** installed globally (optional but convenient)
   ```bash
   npm install -g prisma
   ```

3. **Update dependencies**:
   ```bash
   cd /path/to/phone-case-poc
   npm install @prisma/client
   npm install -D prisma
   ```

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Configure Database URL

Add to your `.env.local` (or `.env`):

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudwing_db"
```

### Step 2: Apply Migrations

```bash
# Using the migration script
./scripts/migrate.sh up

# OR manually
npx prisma migrate dev --name init
```

This will:
- Create the database (if not exists)
- Apply all tables defined in `prisma/schema.prisma`
- Generate Prisma Client

### Step 3: Test Connection

```bash
npx prisma studio
```

Open http://localhost:5555 in your browser to view the database.

---

## 🔄 Migration Strategy

### Phase 1: Dual Write (Compatiblity Mode)

During transition, keep both file and database storage:

```typescript
// lib/db.ts - Unified data access layer
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const PRODUCTS_PATH = join(process.cwd(), 'data', 'products.json')

// Read from file (existing code works)
export function readProductsFromFile() {
  return JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8'))
}

// Write to file AND database
export async function createProduct(product: any) {
  // 1. Write to file (legacy)
  const products = readProductsFromFile()
  products.push(product)
  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2))

  // 2. Write to database (new)
  await prisma.product.create({ data: product })

  // 3. Update category stats
  await prisma.category.updateCategoryStats(product.category)
}
```

### Phase 2: Gradual Migration

1. Migrate historical data:
   ```bash
   # Create a one-time migration script
   npx tsx scripts/migrate-data.ts
   ```

2. Update API routes to read from DB:
   ```typescript
   // app/api/products/route.ts
   export async function GET() {
     const products = await prisma.product.findMany({
       where: { isActive: true },
       orderBy: { updatedAt: 'desc' }
     })
     return NextResponse.json(products)
   }
   ```

3. Keep file writes as backup for 1 week, then remove.

### Phase 3: Full Database Mode

- Remove all direct file reads (`readFileSync`, `writeFileSync`)
- Update all API routes to use Prisma
- Delete `data/products.json` (keep as backup archive)
- Update deploy scripts to run `prisma migrate deploy` on startup

---

## 📊 Data Mapping

| JSON Field | Database Column | Transformation |
|------------|----------------|----------------|
| `id` (string) | `id` (String + cuid) | Keep existing IDs as `id` field (or generate new cuid) |
| `name` | `name` | Direct copy |
| `slug` | `slug` | Direct copy (unique) |
| `category` | `category` | Foreign key? → For now, plain string (matching Category.name) |
| `description` | `description` | Direct copy |
| `moq` | `moq` | Number → Int |
| `priceRange` | `priceRange` | String |
| `leadTime` | `leadTime` | String |
| `material` | `material` | String |
| `compatibility` | `compatibility` | JSON → Json |
| `features` | `features` | JSON → Json |
| `images` | `images` | JSON → Json |
| `viewCount` | `viewCount` | Number → Int |
| `salesCount` | `salesCount` | Number → Int |
| `status` | `status` | 'active' → ACTIVE enum |
| `is_active` | `isActive` | 0/1 → Boolean |
| `created_at` | `createdAt` | String ISO → DateTime |
| `updated_at` | `updatedAt` | String ISO → DateTime |

---

## 🔄 Data Migration Script

Create `scripts/migrate-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const PRODUCTS_PATH = join(process.cwd(), 'data', 'products.json')

async function migrateProducts() {
  console.log('📥 Reading products from JSON file...')
  const rawProducts = JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8'))

  console.log(`Found ${rawProducts.length} products`)

  let migrated = 0
  for (const product of rawProducts) {
    // Transform data
    const dbProduct = {
      id: product.id, // Keep existing IDs
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description || null,
      moq: product.moq,
      priceRange: product.priceRange,
      leadTime: product.leadTime || null,
      material: product.material || null,
      compatibility: product.compatibility || [],
      features: product.features || [],
      images: product.images || [],
      viewCount: product.viewCount || 0,
      salesCount: product.salesCount || 0,
      status: mapStatus(product.status),
      isActive: product.is_active === 1,
      createdAt: product.created_at ? new Date(product.created_at) : new Date(),
      updatedAt: product.updated_at ? new Date(product.updated_at) : new Date(),
    }

    try {
      await prisma.product.upsert({
        where: { id: dbProduct.id },
        create: dbProduct,
        update: dbProduct,
      })
      migrated++
    } catch (error) {
      console.error(`Failed to migrate product ${product.slug}:`, error)
    }
  }

  console.log(`✅ Successfully migrated ${migrated} products`)
  await prisma.$disconnect()
}

function mapStatus(status: string): 'ACTIVE' | 'DRAFT' | 'ARCHIVED' {
  const map: Record<string, 'ACTIVE' | 'DRAFT' | 'ARCHIVED'> = {
    active: 'ACTIVE',
    draft: 'DRAFT',
    archived: 'ARCHIVED',
  }
  return map[status] || 'ACTIVE'
}

migrateProducts().catch(console.error)
```

Run:
```bash
npx tsx scripts/migrate-data.ts
```

---

## 🧪 Testing the Database

1. **Create a test product**:
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "slug": "test-product",
    "category": "Test",
    "moq": 100,
    "priceRange": "$1.00 - $2.00"
  }'
```

2. **Check in Prisma Studio**:
```bash
npx prisma studio
```
Verify the product appears in the `products` table.

3. **Verify queries**:
```bash
npx prisma db seed
# Or test directly in your app
```

---

## 🚀 Production Deployment

### 1. Database Provisioning

**Vercel**:
- Vercel Postgres (built-in)
- Set `DATABASE_URL` in environment variables

**Railway**:
- Create PostgreSQL instance
- Connection string auto-injected

**Manual VPS**:
```bash
createdb cloudwing_db
psql cloudwing_db < prisma/migrations/xxxx_init/up.sql
```

### 2. Zero-Downtime Deployments

Use Prisma Migrate in CI/CD:

```yaml
# .github/workflows/deploy.yml
- name: Apply Database Migrations
  run: |
    npx prisma migrate deploy
```

**Note**: `migrate deploy` is safe for production (applies pending migrations only).

### 3. Backup Strategy

```bash
# Daily backup
pg_dump $DATABASE_URL > backups/cloudwing_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backups/cloudwing_20260328.sql
```

---

## ⚠️ Important Notes

1. **Backup first**: Always backup `data/*.json` before deleting
2. **Keep migrations source-controlled**: `prisma/migrations/`
3. **Never modify migration files after applying** (create new ones instead)
4. **Use `prisma migrate dev` only in development**
5. **Use `prisma migrate deploy` in production**
6. **Seed data**: Create `prisma/seed.ts` to populate initial categories

---

## 📚 Next Steps After Migration

1. Replace all `readFileSync/writeFileSync` with Prisma calls
2. Update API endpoints to use database
3. Add database connection pooling (use `PrismaClient` singleton)
4. Add error handling for DB connection failures
5. Implement connection retry logic
6. Add DB query monitoring (slow query logs)
7. Consider read replicas for scaling

---

**Status**: 🏗️ Schema defined, ready for migration
