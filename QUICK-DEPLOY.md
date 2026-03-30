# ⚡ Quick Deploy Guide

**Fastest route to production**: Vercel (5 minutes)

---

## 1. Prerequisites

- [ ] Vercel account (https://vercel.com/signup)
- [ ] GitHub repository with your code
- [ ] PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)

---

## 2. One-Click Deploy

[Deploy to Vercel](https://vercel.com/new/clone?repository-url=YOUR-REPO-URL)

**Or manually**:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 3. Environment Variables (Vercel Dashboard)

Go to: **Project Settings → Environment Variables**

Add these:

| Key | Value | Type |
|-----|-------|------|
| `NEXT_PUBLIC_BASE_URL` | `https://yourdomain.com` | Plain |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output | Plain |
| `ADMIN_PASSWORD` | `YourStrongPassword123!` | Plain |
| `DATABASE_URL` | `postgresql://...` (from your DB) | Plain |

**SMTP (for email notifications)**:
| `SMTP_HOST` | `smtp.gmail.com` or `smtp.qq.com` | Plain |
| `SMTP_PORT` | `587` | Plain |
| `SMTP_USER` | `your-email@gmail.com` | Plain |
| `SMTP_PASS` | `your-app-password` | Plain |

---

## 4. Database Setup

### Option A: Vercel Postgres (easiest)
1. In Vercel dashboard: **Storage → Create Database → Postgres**
2. Copy connection string to `DATABASE_URL`
3. Run migrations:
   ```bash
   vercel env pull .env.local  # Pull env to local
   npx prisma migrate deploy
   npx prisma db seed
   vercel --prod  # Redeploy
   ```

### Option B: External (Neon, Supabase)
1. Create free PostgreSQL instance
2. Get connection string
3. Set in Vercel env vars
4. Same migrate & seed steps

---

## 5. Run Post-Deploy Tests

```bash
# Pull production env to local (optional)
vercel env pull .env.production

# Update post-deploy test script with your domain
./post-deploy-tests.sh https://yourdomain.com
```

Expected output: **All 40+ tests passed ✅**

---

## 6. Verify

- ✅ Homepage loads
- ✅ Products page shows 128 items
- ✅ Admin login works (`/admin` → password)
- ✅ Language switcher works (EN/简体/繁體)
- ✅ API endpoints return correct data
- ✅ HTTPS active

---

## 7. Custom Domain (Optional)

1. Vercel dashboard → **Domains**
2. Add domain `cloudwing-cases.com`
3. Update DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP)
   ```
4. Wait for propagation (minutes to hours)
5. Update `NEXT_PUBLIC_BASE_URL` in Vercel env

---

## 8. Monitoring (Optional but Recommended)

### Enable Vercel Analytics
Dashboard → **Analytics** → Enable

### Add Sentry
```bash
npm install @sentry/nextjs
# Follow Sentry docs to initialize
```

---

## 9. Rollback (If Something Breaks)

```bash
# See deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-id>
```

---

## Troubleshooting

### Build fails with "PrismaClientInitializationError"
**Fix**: Ensure DATABASE_URL is correct and database exists. Run `npx prisma migrate deploy` locally first.

### E2E tests fail on deployed site
**Fix**: Check that `NEXT_PUBLIC_BASE_URL` is set correctly and site is accessible.

### Admin login doesn't work
**Fix**: Clear cookies, ensure `ADMIN_PASSWORD` env var is set to the same value as local.

### Images not loading
**Fix**: If using custom domain, ensure `metadataBase` in `app/layout.tsx` matches your domain (already set to `https://cloudwing-cases.com`).

---

## That's it! 🎉

Your phone-case-poc is now live.

**Next steps**:
1. Configure email templates (in `lib/email.ts`)
2. Add real products via Admin upload
3. Set up error tracking (Sentry)
4. Configure CDN for images (optional)

---

**Need help?** Check:
- `DEPLOYMENT-CHECKLIST.md` - comprehensive checklist
- `FINAL-STATUS-REPORT.md` - full QA report
- `post-deploy-tests.sh` - automated verification script
