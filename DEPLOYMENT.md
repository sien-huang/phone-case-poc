# CloudWing Phone Case Website - Deployment Guide

**Quick Start**: This website is production-ready after configuration.

---

## ✅ Pre-Deployment Checklist

- [ ] Set environment variables in `.env.local`
- [ ] Configure admin password (required)
- [ ] Configure SMTP (optional but recommended)
- [ ] Replace placeholder product images
- [ ] Update WhatsApp phone number
- [ ] Run build and test locally

---

## 🔐 Required Configuration

### 1. Admin Password (REQUIRED)

Edit `.env.local`:

```bash
ADMIN_PASSWORD=your-very-secure-password-here
```

This protects the `/admin` dashboard. Choose a strong password.

---

### 2. Email Notifications (Recommended)

Configure SMTP to receive email alerts when someone submits the quote form:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use app password for Gmail
ADMIN_EMAIL=your-business-email@example.com
```

**Note**: If SMTP is not configured, form submissions will still be saved to `data/inquiries.json` but no email will be sent.

---

## 🚀 Quick Deployment (3 Steps)

### Step 1: Build
```bash
npm run build
```

### Step 2: Start Server
```bash
npm start
```

The site will be available at `http://localhost:3000` (default Next.js port)

### Step 3: Access Admin
1. Go to `http://localhost:3000/admin`
2. You'll be redirected to `/admin/login`
3. Enter the password from `ADMIN_PASSWORD`
4. View inquiries and product data

---

## ⚙️ Production Deployment

### Recommended Hosting (Node.js)

| Provider | Plan | Price | Why |
|----------|------|-------|-----|
| **Vercel** | Hobby | Free | Best for Next.js, automatic SSL |
| **Railway** | Starter | $5/mo | Simple, good performance |
| **DigitalOcean** | App Platform | $5/mo | Full control |
| **AWS Lightsail** | $3.50/mo | Cheap VPS |

### Environment Variables on Production

Set these in your hosting provider's dashboard:

```bash
ADMIN_PASSWORD=your-secure-password
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
ADMIN_EMAIL=admin@yourcompany.com
NODE_ENV=production
```

### Domain Configuration

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Point A record to your server IP
3. Enable HTTPS (most hosts provide free SSL)
4. Update `next.config.js` if needed

---

## 📁 Project Structure

```
phone-case-poc/
├── app/
│   ├── page.tsx              # Homepage (SEO optimized)
│   ├── products/page.tsx     # Product listing
│   ├── product/[slug]/       # Product details
│   ├── quote/page.tsx        # Quote form
│   ├── factory/page.tsx      # Factory capabilities
│   ├── catalog/page.tsx      # Printable catalog
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   └── login/page.tsx    # Admin login
│   └── api/
│       ├── quote/route.ts    # Form submission + email
│       ├── admin/
│       │   ├── check/route.ts    # Auth check
│       │   ├── login/route.ts    # Login handler
│       │   ├── logout/route.ts   # Logout handler
│       │   ├── inquiries/route.ts # Get inquiries
│       │   └── products/route.ts  # Get products
├── data/
│   ├── products.json         # Product catalog (EDIT THIS)
│   └── inquiries.json        # Form submissions (auto-generated)
├── components/
│   ├── WhatsAppButton.tsx    # Floating chat button
│   └── MobileMenu.tsx        # Mobile navigation
├── public/
│   └── cloudwing-logo.png    # Your logo
├── .env.local                # Configuration (CREATE THIS)
├── middleware.ts             # Admin auth middleware
├── TEST_REPORT.md            # QA test results
└── DEPLOYMENT.md             # This file
```

---

## 🔧 Customization Guide

### Edit Products

Open `data/products.json` and modify:

```json
{
  "id": "unique-id",
  "name": "Product Name",
  "slug": "product-name",
  "category": "Category",
  "description": "Short description",
  "compatibility": ["iPhone 15", "iPhone 15 Pro"],
  "material": "TPU + PC",
  "moq": 500,
  "leadTime": "7-10 business days",
  "priceRange": "$1.80 - $2.50 per piece",
  "patent": "Design Patent Pending",
  "features": ["Feature 1", "Feature 2"]
}
```

After editing, **rebuild**:
```bash
npm run build
```

---

### Update Contact Info

Edit `app/layout.tsx` → `Footer()` function.

---

### Change Brand Color

Edit `app/globals.css`:

```css
:root {
  --primary: #1e40af;  /* Change this */
  --secondary: #64748b;
  --accent: #0ea5e9;
}
```

Also update Tailwind classes if needed.

---

### Replace Product Images

1. Place images in `public/products/`
2. Name them according to `products.json` `images` field
3. Update `products.json` with correct filenames

Example:
```json
"images": [
  "/products/iphone15-classic-main.jpg",
  "/products/iphone15-classic-side.jpg"
]
```

---

## 🧪 Testing After Deployment

Run this script to verify everything works:

```bash
#!/bin/bash
echo "=== CloudWing Site Health Check ==="
echo ""

# Check pages
pages=("/" "/products" "/quote" "/factory" "/admin" "/catalog")
for page in "${pages[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
  echo "$page: $code"
done

# Test form submission
echo ""
echo "Testing form submission..."
response=$(curl -s -X POST http://localhost:3000/api/quote \
  -F "companyName=Test Co" \
  -F "businessType=distributor" \
  -F "targetMarket=usa" \
  -F "quantity=500-1000" \
  -F "products=[\"iphone15-classic\"]")
echo "Response: $response"

# Check data file
echo ""
echo "Checking inquiries.json..."
cat data/inquiries.json | tail -1

echo ""
echo "✅ Health check complete"
```

---

## 🐛 Troubleshooting

### Admin redirect loop
- Ensure `ADMIN_PASSWORD` is set in `.env.local`
- Clear cookies and try again

### Emails not sending
- Check SMTP credentials are correct
- Check spam folder
- Enable "Less secure apps" if using Gmail or use App Password

### Build fails
```bash
rm -rf .next
npm install
npm run build
```

### Port already in use
```bash
pkill -f "next"
# or change PORT environment variable
PORT=3001 npm start
```

---

## 📞 Support

For issues or questions, refer to:
- `TEST_REPORT.md` for detailed QA results
- `AGENTS.md` for agent instructions
- OpenClaw docs: https://docs.openclaw.ai

---

**Version**: 1.0  
**Last Updated**: 2026-03-25  
**Status**: Production Ready (after configuration)