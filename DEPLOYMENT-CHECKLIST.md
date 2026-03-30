# 🚀 Deployment Checklist - phone-case-poc

**Target**: Production  
**Date**: 2026-03-30  
**Version**: 1.0.0

---

## Pre-Deployment ✅

### Code Quality
- [x] TypeScript compilation passes
- [x] ESLint passes (with Next.js defaults)
- [x] No console errors in production build
- [x] Build completes successfully (no errors, no warnings)

### Environment Variables
```bash
# .env.local (Production)
NEXT_PUBLIC_BASE_URL=https://cloudwing-cases.com  # Update with your domain
NEXTAUTH_SECRET=<generate-random-32-chars>
ADMIN_PASSWORD=<change-from-default>
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-auth-code
```

**To generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
# or in Node: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database
- [ ] **Option A (SQLite)**: Keep `DATABASE_URL="file:./prisma/dev.db"` (for small scale)
- [ ] **Option B (PostgreSQL)**: Set `DATABASE_URL="postgresql://..."` (recommended for production)

**If using PostgreSQL**:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### File Uploads
- [ ] `public/uploads/` directory exists (for admin image uploads)
- [ ] Or configure cloud storage (S3, Cloudinary, etc.)

---

## Build Verification ✅

```bash
# Local build test (already done)
npm run build  # ✅ Success

# Verify build output
ls -la .next/static/chunks/ | wc -l  # Should have >20 chunks
ls -la .next/server/  # Should have pages and app files
```

---

## Deployment Methods

### Option 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables in Vercel dashboard:
#    NEXT_PUBLIC_BASE_URL, NEXTAUTH_SECRET, ADMIN_PASSWORD, SMTP_*, DATABASE_URL
```

**Vercel Notes**:
- Automatic HTTPS
- Global CDN
- Serverless functions
- SQLite not recommended → use PostgreSQL add-on

---

### Option 2: Cloudflare Pages

```bash
# 1. Install Wrangler
npm i -g wrangler

# 2. Build
npm run build

# 3. Deploy (Pages)
wrangler pages deploy .next --project-name phone-case-poc
```

**Cloudflare Notes**:
- Configure `_routes` to include `/api/*` as functions
- Use D1 (SQLite) or PostgreSQL for database
- Set env vars in Pages dashboard

---

### Option 3: Self-Hosted (Docker)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t phone-case-poc .
docker run -d -p 3000:3000 --env-file .env.local phone-case-poc
```

---

### Option 4: PM2 on VPS

```bash
# 1. Clone repo on server
git clone <your-repo>
cd phone-case-poc

# 2. Install dependencies
npm ci --only=production

# 3. Build
npm run build

# 4. Start with PM2
pm2 start "npm start" --name phone-case-poc

# 5. Save PM2 config
pm2 save
pm2 startup  # Generate startup script

# 6. Configure Nginx reverse proxy
# /etc/nginx/sites-available/phone-case-poc
server {
    listen 80;
    server_name cloudwing-cases.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Post-Deployment 🧪

### 1. Health Check

```bash
# If running on same machine
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com
# Expected: 200

curl -s https://yourdomain.com/api/products | jq length
# Expected: 128

curl -s https://yourdomain.com/api/admin/stats | jq '.overview.totalProducts'
# Expected: 128
```

### 2. Run E2E Tests (on deployed URL)

```bash
# Update playwright.config.ts to use production URL
# baseURL: 'https://yourdomain.com'

npx playwright test
```

**Expected results**:
- ✅ 23/23 tests pass
- ✅ No "Internal Server Error"
- ✅ All pages load correctly

### 3. Admin Access

```bash
# Login to admin panel
open https://yourdomain.com/admin
# Password: (the one you set in .env.local)

# Verify:
- Dashboard loads with stats
- Products list shows 128 items
- Inquiries page works
- Upload functionality works
```

### 4. Internationalization

```bash
# Test language switching
curl -s -b "locale=zh-Hans" https://yourdomain.com | grep -i "首页"
# Should show Simplified Chinese

curl -s -b "locale=zh-Hant" https://yourdomain.com | grep -i "首頁"
# Should show Traditional Chinese
```

### 5. SEO & Sitemap

```bash
curl -s https://yourdomain.com/sitemap.xml | head -20
# Should contain list of URLs

curl -s https://yourdomain.com/robots.txt
# Should exist and have proper directives
```

---

## Monitoring

### Logs
- **Vercel**: Dashboard → Functions → Logs
- **PM2**: `pm2 logs phone-case-poc`
- **Docker**: `docker logs -f <container-id>`
- **Cloudflare Pages**: Dashboard → Logs

### Error Tracking (Recommended)
- **Sentry**: Create project → add SDK to app
- **LogRocket**: Session replay for debugging

---

## Rollback Plan

### Vercel
```bash
vercel rollback <deployment-id>
```

### PM2
```bash
pm2 stop phone-case-poc
# Switch to previous commit, rebuild, restart
pm2 start phone-case-poc
```

### Docker
```bash
docker stop <container>
docker rm <container>
docker run ... (previous image tag)
```

---

## Final Sign-off

| Item | Status | Verified By |
|------|--------|-------------|
| Build successful | ✅ | CI/CD |
| All tests pass | ⏳ | Manual (post-deploy) |
| Environment variables set | ☐ | DevOps |
| Database migrated | ☐ | DevOps |
| Domain DNS propagated | ☐ | DevOps |
| HTTPS active | ☐ | DevOps |
| Admin login works | ⏳ | Manual |
| API endpoints healthy | ⏳ | Manual |

---

## Quick Reference Commands

### On Production Server
```bash
# Check server status
curl -I https://yourdomain.com

# View PM2 logs
pm2 logs phone-case-poc

# Restart app
pm2 restart phone-case-poc

# View resource usage
pm2 monit
```

### Database Operations
```bash
# Prisma Studio (DB viewer) - dev only
npx prisma studio

# Migrate (if using PostgreSQL)
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

---

**Next Steps**: Deploy and run post-deployment tests!
