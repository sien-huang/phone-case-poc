# 📸 Product Images Preparation Guide

## 🎯 Overview

Current state: All product images use `picsum.photos` placeholders.

Goal: Replace with real product photos for professional presentation.

---

## 📁 Image Requirements

### 1. File Format
- **Recommended**: WebP (smaller, modern)
- **Accepted**: JPG, PNG
- **Resolution**: Minimum 800×800px (recommended 1200×1200px for retina)
- **Aspect Ratio**: 1:1 (square) or 4:3 (landscape)
- **Max File Size**: < 500KB per image (optimize before upload)

### 2. Naming Convention

Match the product `slug` from `data/products.json`:

```
public/products/{slug}-main.jpg        # Primary product image
public/products/{slug}-angle1.jpg      # Additional angle shots
public/products/{slug}-lifestyle.jpg   # Lifestyle/usage photo
public/products/{slug}-detail.jpg      # Close-up/detail shot
```

Example:
```json
{
  "slug": "iphone15-classic"
}
```
Images:
```
public/products/iphone15-classic-main.jpg
public/products/iphone15-classic-angle1.jpg
public/products/iphone15-classic-lifestyle.jpg
```

### 3. Quantity per Product

- **Minimum**: 1 image (main)
- **Recommended**: 3-5 images per product
- **Ideal**: 6-8 images (main + angles + lifestyle + detail)

---

## 📋 Step-by-Step Process

### Step 1: Prepare Images Locally

1. Collect product photos from your supplier/manufacturer
2. Rename files according to slug naming convention
3. Optimize images (lossless compression):
   ```bash
   # Using ImageMagick
   mogrify -resize 1200x1200 -quality 85 -format webp public/products/*.jpg

   # Or use Squoosh (https://squoosh.app) online
   ```

### Step 2: Upload to `public/products/`

Place all images in the project folder:
```bash
cp /path/to/your/images/*.jpg /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc/public/products/
```

Verify:
```bash
ls -lh /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc/public/products/
```

### Step 3: Update `data/products.json`

For each product, update the `images` array:

```json
{
  "id": "iphone15-classic",
  "name": "iPhone 15 Classic",
  "slug": "iphone15-classic",
  ...
  "images": [
    "/products/iphone15-classic-main.jpg",
    "/products/iphone15-classic-angle1.jpg",
    "/products/iphone15-classic-lifestyle.jpg"
  ]
}
```

**Note**: Paths must start with `/products/` to be served correctly.

### Step 4: Rebuild & Verify

```bash
cd /home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc
npm run build
npm start
```

Visit product pages and verify images load correctly:
- http://localhost:3000/product/iphone15-classic
- Check carousel navigation
- Check mobile responsiveness

---

## 🔧 Fallback for Missing Images

The app includes automatic fallback logic:

1. If product image URLs exist but return 404 → show placeholder
2. Placeholder: colored gradient with product initials

This ensures the site never shows broken images.

---

## 📊 128 Products - Quick Reference

| Category | Count | Images Needed (min) | Images Needed (ideal) |
|----------|-------|-------------------|---------------------|
| iPhone 15 Series | ~30 | 30 | 180 |
| Samsung Galaxy | ~30 | 30 | 180 |
| Google Pixel | ~25 | 25 | 150 |
| Other Models | ~43 | 43 | 258 |
| **Total** | **128** | **128** | **~768** |

**Estimated storage**: 128 images × 200KB = ~25MB (acceptable)

---

## ⏱️ 预估时间

| 任务 | 时间 |
|------|------|
| 收集整理原图 | 2-4 hours |
| 重命名文件 | 1 hour |
| 压缩优化 | 30 min |
| 更新 products.json | 1 hour |
| 测试验证 | 30 min |
| **总计** | **5-7 hours** |

---

## 🚀 Ready to Deploy Checklist

- [ ] All 128 products have at least 1 real image
- [ ] Image paths in `products.json` match actual filenames
- [ ] Images optimized (< 500KB each)
- [ ] Build passes without image warnings
- [ ] Mobile carousel works smoothly
- [ ] Placeholder images removed (optional)

---

## 📞 Need Help?

If you don't have product images yet:

1. **Use manufacturer stock photos** (most B2B suppliers provide them)
2. **Request from your supplier**: "Can you send product images for all SKUs?"
3. **Temporary solution**: Keep placeholders but add a note "Images coming soon"

Once you have the images, I can help you:
- Bulk rename files via script
- Update `products.json` automatically
- Optimize and compress

---

**Status**: 📋 Awaiting image assets from you
