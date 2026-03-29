# 🚀 手机壳 POC - Vercel + Supabase 部署指南

**项目**: Phone Case Wholesale B2B POC  
**技术栈**: Next.js 15 + TypeScript + Tailwind + Prisma + PostgreSQL  
**部署目标**: Vercel (免费托管) + Supabase (免费数据库)  
**预计时间**: 30-50 分钟  
**难度**: ⭐⭐ (简单)

---

## 📋 目录

1. [前置准备](#前置准备)
2. [Supabase 数据库设置](#supabase-数据库设置)
3. [Vercel 项目部署](#vercel-项目部署)
4. [环境变量配置](#环境变量配置)
5. [数据库迁移](#数据库迁移)
6. [上线验证](#上线验证)
7. [自定义域名绑定](#自定义域名绑定)
8. [常见问题](#常见问题)

---

## 📦 前置准备

### 必要账户

- [x] **GitHub** - 代码托管（已假设有）
- [ ] **Supabase** - 免费 PostgreSQL [注册地址](https://supabase.com)
- [ ] **Vercel** - 免费托管 [注册地址](https://vercel.com)

### 本地检查

确保本地开发环境正常：

```bash
cd /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc

# 检查类型
npm run type-check

# 检查代码规范
npm run lint

# 运行测试
npm run test

# 启动开发服务器（确认无错）
npm run dev
# 访问 http://localhost:3001 应正常显示
```

---

## 🗄️ Supabase 数据库设置

### Step 1: 创建项目

1. 访问 [Supabase](https://supabase.com) → **Sign up**（推荐 GitHub 登录）
2. 点击 **New Project**
3. 填写信息：
   - **Name**: `phone-case-poc`（或自定义）
   - **Database Password**: 生成强密码（复制保存）
   - **Region**: 选择离你最近的（建议 `Singapore` 亚洲用户）
4. 点击 **Create new project**
5. 等待 2-3 分钟创建完成

### Step 2: 获取 DATABASE_URL

1. 左侧菜单 → **Database** → **Connection string**
2. 选择 **Connection pooling**（默认）
3. 复制 **URI** 格式的链接，类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:6543/postgres?sslmode=require
   ```
4. **重要**: 去掉 `?sslmode=require` 后面的参数，最终应该是：
   ```
   postgresql://postgres:YourPassword@db.xxxxx.supabase.co:6543/postgres
   ```
5. 保存这个 `DATABASE_URL`，下一步要用

### Step 3: 测试连接（可选）

```bash
# 安装 psql 客户端
sudo apt-get install postgresql-client

# 测试连接（替换为你的 URL）
psql "postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres"
```

---

## ⚡ Vercel 项目部署

### Step 1: Push 代码到 GitHub

如果本地还没推送到远程：

```bash
cd /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc

# 初始化（如果还没做）
git init
git add .
git commit -m "Initial commit - ready for deployment"

# 创建 GitHub 仓库（在 github.com 上）
# 然后关联并推送
git remote add origin https://github.com/YOUR_USERNAME/phone-case-poc.git
git branch -M main
git push -u origin main
```

### Step 2: 导入 Vercel

1. 访问 [Vercel](https://vercel.com) → **Sign up**（用 GitHub 登录）
2. 点击 **Add New...** → **Project**
3. **Import** 你的 `phone-case-poc` 仓库
4. **Framework Preset**: 选择 `Next.js`
5. **Root Directory**: 保持 `.`（项目根目录）
6. 点击 **Deploy**

Vercel 会自动：
- 运行 `npm install`
- 运行 `npm run build`
- 部署到全球 CDN

**等待 2-5 分钟**，部署完成会得到一个 `*.vercel.app` 域名。

---

## 🔐 环境变量配置

部署前或部署后，在 Vercel Dashboard 配置环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量（从 `.env.example` 复制）：

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | **必须** - Supabase 连接串 |
| `ADMIN_PASSWORD` | `your-secure-password` | 管理后台密码（8位以上） |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` | 你的 Vercel 域名 |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` (可选) | Google Analytics |
| `SMTP_HOST` | `smtp.gmail.com` | 邮件服务器（可选配置） |
| `SMTP_PORT` | `587` | 邮件端口 |
| `SMTP_USER` | `your-email@gmail.com` | 发件邮箱 |
| `SMTP_PASS` | `your-app-password` | 邮箱应用专用密码 |
| `ADMIN_EMAIL` | `admin@yourcompany.com` | 管理员邮箱 |

3. 点击 **Save**
4. **Redeploy** 项目（让环境变量生效）

---

## 🗃️ 数据库迁移

Vercel 部署完代码后，需要执行 Prisma 迁移来创建表结构。

### 方法 A: Vercel 内置 Terminal（推荐）

1. Vercel Dashboard → 项目 → **Terminal**
2. 运行：
   ```bash
   npm run db:deploy
   ```
3. 等待完成，看到 `Your database is now in sync.`

### 方法 B: Vercel CLI（本地）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 进入项目目录
cd /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc

# 拉取 Vercel 项目配置
vercel pull --environment=production

# 执行迁移
vercel env pull .env.vercel  # 拉取环境变量
npm run db:deploy
```

### 方法 C: 直接使用 Supabase SQL 执行（手动）

如果上述方法失败，手动执行：

1. Supabase Dashboard → **SQL Editor**
2. 点击 **New Query**
3. 打开 `prisma/migrations/` 目录，找到最新的 `*.sql` 文件
4. 复制全部内容粘贴进去，点击 **Run**

---

## 🧪 可选：Seed 测试数据

```bash
# 方法 A: Vercel Terminal
npm run db:seed

# 方法 B: Supabase Studio
# 打开 Supabase → Table Editor → 手动添加几条产品数据
```

---

## ✅ 上线验证

### 1. 访问你的 Vercel 域名

打开 `https://your-app.vercel.app`

**应看到**：
- ✅ 网站首页正常显示（中英文切换正常）
- ✅ 产品列表页正常
- ✅ 产品详情页正常
- ✅ Admin 登录页可访问 (`/admin`)

### 2. 测试 Admin 功能

1. 访问 `https://your-app.vercel.app/admin`
2. 输入 `ADMIN_PASSWORD`（你配置的那个）
3. 登录成功，进入 Dashboard
4. 测试：
   - ✅ 创建产品（上传图片）
   - ✅ 查看询盘列表
   - ✅ 生成 PDF（询盘详情页）

### 3. 测试表单提交

- 访问 `/contact` 或 `/inquiry`
- 填写表单提交
- 检查 Admin → 询盘列表是否收到
- 检查邮箱是否收到通知（如有配置 SMTP）

### 4. 测试 API 接口

```bash
# 检查数据库连接
curl https://your-app.vercel.app/api/health

# 测试询盘 API（带 JSON 响应）
curl https://your-app.vercel.app/api/inquiries
```

---

## 🌐 自定义域名绑定（可选）

### 使用 Namecheap 域名

1. **Vercel 添加域名**：
   - Vercel Dashboard → 项目 → **Domains**
   - 输入你的域名（如 `www.yourphonecase.com`）
   - 复制显示的 **DNS 记录**（通常是 CNAME）

2. **Namecheap DNS 设置**：
   - 登录 Namecheap → **Domain List** → 你的域名 → **Manage**
   - 进入 **Advanced DNS**
   - 添加 CNAME 记录：
     - **Host**: `www`（或 `@` 表示根域名）
     - **Value**: `cname.vercel-dns.com`（Vercel 提供）
     - **TTL**: `Automatic`
   - 保存

3. **等待生效**（5-30 分钟）
4. Vercel 自动配置 HTTPS ✅

---

## 🐛 常见问题

### Q1: 构建失败 - `prisma` 相关错误

**原因**: Vercel 没安装 dev dependencies

**解决**:
1. Vercel Dashboard → Project → **Settings** → **Build & Output Settings**
2. 打开 **Install Command** → 改为:
   ```
   npm install --include=dev
   ```
3. Redeploy

---

### Q2: `DATABASE_URL` 连接失败

**可能原因**:
- Supabase 项目未启动（Supabase Dashboard → 项目状态）
- `sslmode` 参数缺失

**解决**:
- 确保 Supabase 项目是 **Active** 状态
- Vercel 的 `DATABASE_URL` 应使用 **Connection pooling** 格式（带端口 6543）
- 或尝试使用 Supabase Postgres 的 **Direct connection** 格式（端口 5432）

---

### Q3: 数据库迁移失败 - `relation "..." does not exist`

**原因**: 未执行 `db:deploy`

**解决**: 在 Vercel Terminal 执行 `npm run db:deploy`

---

### Q4: 图片上传失败

**原因**: Vercel 无持久化存储，上传的文件会丢失

**解决**:
- 方案 A（临时）: 仅用于测试，重启后文件消失
- 方案 B（推荐）: 使用 **Supabase Storage** 或 **Cloudinary**（需额外配置）
- 方案 C（快速）: 图片转为 Base64 存入数据库（仅适合小图）

---

### Q5: 邮件发送失败

**原因**: Gmail 需要应用专用密码（2FA 开启后）

**解决**:
1. 开启 Gmail 两步验证
2. 生成 **App Password**（16位）
3. `SMTP_PASS` 填这个密码（不是登录密码）

---

### Q6: 国际化失效（中英文切换无反应）

**原因**: `next-intl` 配置问题

**检查**:
- `middleware.ts` 是否正确配置 i18n
- `messages/` 目录是否有 `en.json` 和 `zh-Hans.json`
- `NEXT_PUBLIC_BASE_URL` 是否正确

---

### Q7: 需要升级 Vercel 套餐（付费功能）？

Next.js 15 + Serverless 在 Hobby 套餐完全够用，除非：
- 需要超过 1000 次/天的 Serverless 函数调用
- 需要团队协作
- 需要更多构建小时

---

## 📊 部署检查清单

- [ ] 已注册 Supabase 并创建项目
- [ ] 已获取 `DATABASE_URL`
- [ ] 代码已 Push 到 GitHub
- [ ] 已导入 Vercel 并完成首次构建
- [ ] 已在 Vercel 配置环境变量（所有 `.env.example` 中的项）
- [ ] 已在 Vercel Terminal 执行 `npm run db:deploy`
- [ ] 网站首页访问正常
- [ ] Admin 后台登录正常
- [ ] 数据库操作正常（增删改查）
- [ ] 表单提交正常（如有）
- [ ] 邮件通知正常（如有配置）
- [ ] 自定义域名绑定完成（可选）

---

## 🎉 上线完成！

恭喜！你的 B2B 手机壳独立站已上线 Vercel 全球 CDN。

**后续优化**:
- 添加 Google Analytics 4 追踪
- 配置 Cloudflare CDN（加速国内访问）
- 设置邮件模板（询盘自动回复）
- 添加产品图片 WebP 优化

---

## 📞 获取帮助

- **Vercel 文档**: https://vercel.com/docs
- **Supabase 文档**: https://supabase.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **项目问题**: 在 GitHub Issues 提问
