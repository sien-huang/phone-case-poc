# 🗄️ D1 数据库方案配置指南

**目标**: 将 phone-case-poc 从本地 SQLite 迁移到 Cloudflare D1 无服务器数据库

---

## 📋 目录

1. [D1 优势](#d1-优势)
2. [快速开始](#快速开始)
3. [详细步骤](#详细步骤)
4. [数据迁移](#数据迁移)
5. [本地开发](#本地开发)
6. [部署到生产](#部署到生产)
7. [故障排除](#故障排除)

---

## 🚀 D1 优势

| 特性 | 本地 SQLite | Cloudflare D1 |
|------|-------------|---------------|
| 全球低延迟 | ❌ | ✅ 全球边缘节点 |
| 自动扩展 | ❌ | ✅ 无服务器自动扩展 |
| 零运维 | ❌ | ✅ 完全托管 |
| 备份恢复 | ❌ 手动 | ✅ 自动备份 |
| 成本 | ✅ 免费 | ✅ 按使用量付费 |
| 事务支持 | ✅ | ✅ |
| SQLite 兼容 | ✅ | ✅ 大部分兼容 |

---

## ⚡ 快速开始（3 步）

### 1. 创建 D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create phone_case_poc_db

# 输出示例:
# Created database with id 'xxxx-xxxx-xxxx-xxxx'
# 保存这个 database_id！
```

### 2. 更新 wrangler.jsonc

替换 `database_id` 为真实的 ID：

```jsonc
{
  "[[d1_databases]]": {
    "binding": "DB",
    "database_name": "phone_case_poc_db",
    "database_id": "your-actual-database-id-here"
  }
}
```

### 3. 部署到 Cloudflare

```bash
# 本地绑定 D1 并推送 schema
npx wrangler d1 execute phone_case_poc_db --schema=./prisma/schema.sql --remote

# 或者先本地推送到远程
npx wrangler d1 migrations apply phone_case_poc_db --remote

# 部署应用
npx wrangler deploy
```

---

## 📝 详细步骤

### Step 1: 准备 Prisma Schema

✅ **已完成**：`prisma/schema.prisma` 已调整，移除了 D1 不支持的级联删除约束。

关键修改：
- 移除所有 `onDelete: Cascade`
- 使用软删除（`isActive` Boolean 字段）
- 保持所有现有索引和映射

### Step 2: 生成 SQLite SQL

将 Prisma schema 转换为 SQLite SQL：

```bash
# 在项目根目录执行
npx prisma migrate dev --name init-d1
```

这会生成：
- `prisma/migrations/xxxx_init-d1/up.sql`
- `prisma/migrations/xxxx_init-d1/down.sql`

### Step 3: 配置 wrangler.jsonc

修改 `wrangler.jsonc`，添加 D1 绑定：

```jsonc
{
  "name": "phone-case-poc",
  "main": ".next/standalone/server.js",
  "compatibility_date": "2026-03-30",
  "assets": {
    "directory": ".next/static"
  },
  "[[d1_databases]]": {
    "binding": "DB",
    "database_name": "phone_case_poc_db",
    "database_id": "your-database-id"
  }
}
```

**重要**：
- `binding`: 代码中通过 `env.DB` 访问
- `database_name`: D1 数据库名称
- `database_id`: 从 `wrangler d1 create` 获取

### Step 4: 更新 lib/db.ts 支持 D1

需要适配 D1 的连接方式。D1 在 Workers 环境通过 `env.DB` 传递，不是 URL。

添加环境检测和连接逻辑：

```typescript
// lib/db.ts - 在文件顶部添加
import { PrismaClient } from '@prisma/client'

// 检测是否在 Cloudflare Workers 环境
const isCloudflare = typeof process !== 'undefined' && !!process.env.CF_WORKER

// 初始化 Prisma
let prisma: PrismaClient

if (isCloudflare) {
  // Cloudflare D1 环境
  // D1 binding 在 runtime 中通过 env.DB 传递
  // 使用特殊的 datasource proxy
  prisma = new PrismaClient({
    datasourceUrl: 'file:./d1-dev.db', // 这个在本地 dev 用
  })
} else {
  // 本地开发或普通 Node.js
  prisma = new PrismaClient()
}

// ... 现有导出函数保持不变
```

**实际运行时注意**：
- 在 Cloudflare Workers 中，需要通过 `wrangler` 的 datasource proxy 或者使用 `@prisma/adapter-libsql`
- 建议使用 `@prisma/adapter-libsql` 来支持 D1

### Step 5: 安装 D1 适配器

```bash
npm install @prisma/adapter-libsql
npm install -D @libsql/dnsseeded  # 可选，用于 DNS 优化
```

然后修改 `lib/db.ts`：

```typescript
import { PrismaClient } from '@prisma/client'
import { LibSQLAdapter } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// 创建 LibSQL 客户端 (用于 D1)
function createD1Client() {
  const url = process.env.D1_DATABASE_URL || 'file:./d1-dev.db'
  return createClient({ url })
}

// 初始化 Prisma
let prisma: PrismaClient

if (process.env.D1_DATABASE_URL) {
  const libsqlClient = createD1Client()
  const adapter = new LibSQLAdapter(libsqlClient)
  prisma = new PrismaClient({ adapter })
} else {
  prisma = new PrismaClient()
}
```

---

## 📊 数据迁移

### 从本地 SQLite 迁移到 D1

1. **导出本地数据**（如果已有数据）

```bash
# 导出为 SQL
sqlite3 prisma/dev.db .dump > dev-data.sql

# 或者使用 Prisma 导出
npx prisma db execute --stdin < dev-data.sql
```

2. **推送到 D1 远程数据库**

```bash
# 生成迁移文件
npx prisma migrate dev --name d1-migration

# 推送到远程 D1
npx wrangler d1 execute phone_case_poc_db --file=./prisma/migrations/xxxx_d1-migration/up.sql --remote
```

### 使用迁移脚本自动化

创建 `scripts/migrate-to-d1.ts`：

```typescript
import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

const D1_DATABASE_URL = process.env.D1_DATABASE_URL

if (!D1_DATABASE_URL) {
  throw new Error('D1_DATABASE_URL not set')
}

// 1. 连接本地数据库读取所有数据
const localPrisma = new PrismaClient()

// 2. 连接 D1
const d1Client = createClient({ url: D1_DATABASE_URL })
const d1Db = new PrismaClient({
  adapter: new LibSQLAdapter(d1Client)
})

// 3. 迁移 Products
const products = await localPrisma.product.findMany()
for (const product of products) {
  await d1Db.product.upsert({
    where: { id: product.id },
    create: product,
    update: product,
  })
}

console.log(`✅ Migrated ${products.length} products`)

await localPrisma.$disconnect()
await d1Db.$disconnect()
```

运行：
```bash
D1_DATABASE_URL=file:./d1-local.db npx tsx scripts/migrate-to-d1.ts
```

---

## 💻 本地开发

### 使用 D1 本地模拟

```bash
# 安装 wrangler CLI（如果还没装）
npm install -g wrangler

# 启动本地 D1 数据库
npx wrangler d1 execute phone_case_poc_db --schema=./prisma/schema.sql --local

# 在 .env.local 中设置
DATABASE_URL="file:./d1-local.db"
```

### 验证本地连接

```bash
# 启动本地开发
npm run dev

# 访问 http://localhost:3000/api/test-db 验证连接
```

---

## 🚀 部署到生产

### 1. Cloudflare Pages / Workers 配置

**Pages**:
- 部署设置 → 环境变量
- 添加 `D1_DATABASE_URL`（会自动注入，无需手动设置）

**Workers**:
- wrangler 自动处理 D1 绑定

### 2. 运行生产迁移

```bash
# 迁移 schema
npx wrangler d1 migrations apply phone_case_poc_db --remote

# 或者直接执行 SQL
npx wrangler d1 execute phone_case_poc_db --schema=./prisma/schema.sql --remote
```

### 3. 部署应用

```bash
npx wrangler deploy
# 或 Pages 自动部署
```

### 4. 验证生产

```bash
# 查询 D1 数据库
npx wrangler d1 execute phone_case_poc_db --command "SELECT COUNT(*) FROM products" --remote
```

---

## 🔧 修改后的文件清单

| 文件 | 修改内容 |
|------|----------|
| `prisma/schema.prisma` | ✅ 移除 `onDelete: Cascade` |
| `wrangler.jsonc` | ✅ 添加 `[[d1_databases]]` 绑定 |
| `lib/db.ts` | ⏳ 添加 D1 适配逻辑 |
| `.env.local` | ⏳ 添加 `D1_DATABASE_URL` |
| `scripts/migrate-to-d1.ts` | ⏳ 创建迁移脚本 |
| `docs/D1_SETUP.md` | ⏳ 本文件 |

---

## ⚠️ 故障排除

### 问题：`relation does not exist`

**原因**: 迁移未应用。

**解决**:
```bash
npx wrangler d1 migrations apply phone_case_poc_db --remote
```

### 问题：`foreign key constraint failed`

**原因**: D1 不支持外键约束 enforcement。

**解决**:
- 确保 schema 中没有 `onDelete: Cascade`（已移除）
- 在应用层处理引用完整性

### 问题：本地 dev 时连接错误

**原因**: 缺少 D1 本地模拟。

**解决**:
```bash
npx wrangler d1 execute phone_case_poc_db --schema=./prisma/schema.sql --local
```

### 问题：`feature not supported: JSON`

**原因**: D1 的 SQLite 版本可能 JSON 支持有限。

**解决**:
- 将 `Json` 类型改为 `Text`（如果需要）
- 修改 Prisma schema:
  ```prisma
  compatibility String? // 改为 String
  features String?     // 存储 JSON 字符串
  ```

---

## 📞 支持

- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- Prisma LibSQL Adapter: https://www.prisma.io/docs/adapters/libsql
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

---

**下一步**: 
1. 前往 Cloudflare Dashboard 创建 D1 数据库
2. 更新 `wrangler.jsonc` 的 `database_id`
3. 修改 `lib/db.ts` 添加 D1 适配器
4. 运行数据迁移
5. 部署测试

需要我帮你自动完成这些步骤吗？🚀
