#!/bin/bash

# CloudWing Health Check Script
# Usage: ./scripts/health-check.sh [port]

PORT=${1:-3000}
BASE_URL="http://localhost:$PORT"

echo "🏥 CloudWing Health Check"
echo "========================"
echo "Target: $BASE_URL"
echo ""

# Check if server is running
echo "1. Checking server status..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$response" = "200" ]; then
  echo "   ✅ Server is running (HTTP $response)"
else
  echo "   ❌ Server not responding (HTTP $response)"
  echo "   Try: npm run dev"
  exit 1
fi

# Check key pages
echo ""
echo "2. Testing key pages..."
pages=(
  "/"
  "/products"
  "/quote"
  "/admin"
  "/api/products"
  "/api/products/hot"
)

for page in "${pages[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  if [ "$code" = "200" ]; then
    echo "   ✅ $page"
  else
    echo "   ❌ $page (HTTP $code)"
  fi
done

# Check API health
echo ""
echo "3. Testing API endpoints..."
products_count=$(curl -s "$BASE_URL/api/products" | jq '. | length' 2>/dev/null)
if [ -n "$products_count" ] && [ "$products_count" -gt 0 ]; then
  echo "   ✅ Products API returned $products_count products"
else
  echo "   ⚠️  Products API check failed (jq not installed or empty)"
fi

hot_count=$(curl -s "$BASE_URL/api/products/hot" | jq '. | length' 2>/dev/null)
if [ -n "$hot_count" ] && [ "$hot_count" -le 10 ]; then
  echo "   ✅ Hot products API returned $hot_count items"
else
  echo "   ⚠️  Hot products check failed"
fi

# Check environment
echo ""
echo "4. Environment Configuration:"
if [ -f ".env.local" ]; then
  echo "   ✅ .env.local exists"
  if grep -q "ADMIN_PASSWORD" .env.local; then
    echo "   ✅ ADMIN_PASSWORD set"
  else
    echo "   ⚠️  ADMIN_PASSWORD not set"
  fi
  if grep -q "NEXT_PUBLIC_BASE_URL" .env.local; then
    echo "   ✅ NEXT_PUBLIC_BASE_URL set"
  else
    echo "   ⚠️  NEXT_PUBLIC_BASE_URL not set (optional)"
  fi
else
  echo "   ⚠️  .env.local not found (using defaults)"
fi

# Data files check
echo ""
echo "5. Data Files:"
if [ -f "data/products.json" ]; then
  count=$(jq 'length' data/products.json 2>/dev/null || echo "0")
  echo "   ✅ products.json exists ($count products)"
else
  echo "   ❌ products.json missing"
fi

if [ -f "data/inquiries.json" ]; then
  echo "   ✅ inquiries.json exists"
else
  echo "   ⚠️  inquiries.json missing (will be created on first inquiry)"
fi

# Database check
echo ""
echo "6. Database Status:"
if [ -n "$DATABASE_URL" ]; then
  echo "   ✅ DATABASE_URL is set"
  echo "   (Using PostgreSQL - ensure it's running)"
else
  echo "   ⚠️  DATABASE_URL not set (using file storage fallback)"
  echo "   This is fine for development but not recommended for production."
fi

echo ""
echo "========================"
echo "✅ Health check complete!"
echo ""
echo "Next steps:"
echo "  - Open http://localhost:$PORT in your browser"
echo "  - Test admin panel: http://localhost:$PORT/admin"
echo "  - See QUICK_TEST.md for detailed test cases"
