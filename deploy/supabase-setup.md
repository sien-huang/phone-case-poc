# 🗄️ Supabase + Prisma 完整配置指南

---

## 📦 Supabase 创建步骤（快速版）

### 1️⃣ 注册并创建项目

```bash
# 访问 https://supabase.com
# 点击 Sign up → GitHub 一键登录（推荐）

# New Project
Name: phone-case-poc
Database Password: [生成强密码，复制保存]
Region: Singapore（亚洲用户选这个）

# 等待 2-3 分钟
```

### 2️⃣ 获取连接串

```
Supabase Dashboard → Database → Connection string
选择: Connection pooling（默认）
复制: URI 格式

示例:
postgresql://postgres:abc123def456@db.abcdefghijklmnop.supabase.co:6543/postgres?sslmode=require
```

**重要**：去掉 `?sslmode=require` 后面的参数，最终：

```
postgresql://postgres:abc123def456@db.abcdefghijklmnop.supabase.co:6543/postgres
```

这就是你的 `DATABASE_URL`。

---

## 🗃️ Prisma Schema 检查

你的项目已有 `prisma/schema.prisma`，检查包含以下模型：

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  password      String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Product {
  id            String    @id @default(cuid())
  name          String
  nameZh        String?
  slug          String    @unique
  description   String?
  descriptionZh String?
  price         Decimal
  comparePrice  Decimal?
  images        String[]
  isActive      Boolean   @default(true)
  category      String?
  tags          String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Inquiry {
  id            String    @id @default(cuid())
  customerName  String
  companyName   String?
  email         String
  phone         String?
  country       String
  products      Json      // 产品列表 { productId, quantity, note }[]
  message       String?
  status        String    @default("new") // new, contacted, quoted, ordered
  quotedPrice   Decimal?
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 其他模型... Order, Category, etc.
```

---

## 🚀 部署流程（全自动化）

### **方法 A**: Vercel 一键部署（推荐）

```bash
# 1. 确保 GitHub 有最新代码
git add .
git commit -m "deploy: ready for Vercel"
git push origin main

# 2. Vercel Dashboard 配置环境变量
# 填入 DATABASE_URL、ADMIN_PASSWORD、NEXT_PUBLIC_BASE_URL 等

# 3. Vercel Terminal 执行迁移
npm run db:deploy

# 4. 验证
npm run db:seed  # 可选：填充测试数据
```

---

### **方法 B**: 本地手动迁移（如果 Vercel Terminal 失败）

```bash
# 1. 本地拉取 Vercel 环境变量
vercel env pull .env.vercel

# 2. 本地测试连接
psql "postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres"

# 3. 执行迁移
npm run db:deploy

# 4. 查看迁移状态
npx prisma migrate status
```

---

### **方法 C**: 直接 SQL 执行（手動）

```bash
# 1. 生成 SQL 文件（如果还没有）
npx prisma migrate dev --create-only  # 在本地先创建迁移文件

# 迁移文件在: prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql

# 2. 打开 Supabase Dashboard → SQL Editor
# 3. 复制 migration.sql 内容粘贴执行
```

---

## 🧪 验证数据库连接

```bash
# 使用 Vercel Terminal
npx prisma studio

# 如果看到 Prisma Studio 界面（可能需要配置端口），说明连接成功
# 或直接运行查询：
npx prisma db seed  # 会执行 prisma/seed.ts
```

---

## 🔧 常见 Supabase 问题

### **Q: 连接超时/拒绝连接**

- 检查 Supabase 项目状态是否为 **Active**
- 检查是否使用 **Connection pooling** URL（端口 6543）
- 如果使用 Direct connection，端口是 5432

### **Q: SSL 错误**

Supabase 强制 SSL，确保连接串包含 `?sslmode=require` 或使用 pooling URL（自动 SSL）。

**正确的 pooling URL 示例**:
```
postgresql://postgres:pwd@db.xxx.supabase.co:6543/postgres
```

**不需要手动加 `sslmode`**，pooling 已处理。

---

### **Q: 密码错误**

- Supabase 项目密码是创建时设置的，不是你的 Supabase 账户密码
- 如果忘记：Supabase Dashboard → Project Settings → Database → **Reset password**

---

### **Q: 迁移失败 - "already exists"**

**原因**: 该迁移已应用过

**解决**:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
# 然后重新 deploy
npm run db:deploy
```

---

## 📊 数据库管理工具

### Supabase Studio（Web）

- 地址: `https://your-project.supabase.co`
- 功能:
  - Table Editor（可视化增删改查）
  - SQL Editor（执行任意 SQL）
  - Authentication（用户管理）
  - Storage（文件存储）

### Prisma Studio（本地/远程）

```bash
# 需要开启 5555 端口（Vercel 不支持直接开）
# 可在本地运行（需 DATABASE_URL 指向 Supabase）
DATABASE_URL="your-supabase-url" npx prisma studio
# 访问 http://localhost:5555
```

---

## 🎯 下一步

✅ 数据库配置完成 → **环境变量配置** → **Vercel 部署** → **迁移** → **上线验证**

---

**完成 Supabase 配置后，回复我 DATABASE_URL（或确认已设置）**，我继续指导迁移和上线 🚀
