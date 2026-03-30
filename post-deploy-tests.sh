#!/bin/bash

# Post-Deployment Test Script
# Usage: ./post-deploy-tests.sh https://yourdomain.com

set -e  # Exit on error

BASE_URL=${1:-http://localhost:3000}
echo "🧪 Running Post-Deployment Tests"
echo "Target: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected="$3"

  echo -n "Testing $name... "
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")

  if [ "$status" = "$expected" ]; then
    echo -e "${GREEN}✓${NC} $endpoint → $status"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $endpoint → Expected $expected, got $status"
    ((FAILED++))
  fi
}

# Test API endpoint with JSON validation
test_api_json() {
  local name="$1"
  local endpoint="$2"
  local field="$3"
  local expected_value="$4"

  echo -n "Testing $name... "
  local response=$(curl -s "$BASE_URL$endpoint")

  # Extract field value using jq
  local actual_value=$(echo "$response" | jq -r ".$field" 2>/dev/null || echo "null")

  if [ "$actual_value" = "$expected_value" ] && [ "$actual_value" != "null" ]; then
    echo -e "${GREEN}✓${NC} $endpoint → $field = $actual_value"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $endpoint → Expected $field = $expected_value, got $actual_value"
    ((FAILED++))
  fi
}

# 1. Public Pages
echo "=== Public Pages ==="
test_endpoint "Homepage" "/" "200"
test_endpoint "Products" "/products" "200"
test_endpoint "Categories" "/categories" "200"
test_endpoint "Certifications" "/certifications" "200"
test_endpoint "About" "/about" "200"
test_endpoint "Inquiry" "/inquiry" "200"
test_endpoint "Catalog" "/catalog" "200"
test_endpoint "Privacy Policy" "/privacy-policy" "200"
test_endpoint "Terms of Service" "/terms-of-service" "200"
test_endpoint "Login" "/login" "200"
test_endpoint "Register" "/register" "200"
echo ""

# 2. API Endpoints
echo "=== API Endpoints ==="
test_endpoint "API Products" "/api/products" "200"
test_api_json "Products count" "/api/products" "length" "128"
test_endpoint "API Categories" "/api/admin/categories" "200"
test_api_json "Categories count" "/api/admin/categories" "length" "20"
test_endpoint "API Stats" "/api/admin/stats" "200"
test_api_json "Stats totalProducts" "/api/admin/stats" "overview.totalProducts" "128"
echo ""

# 3. Admin Pages (need to handle auth)
echo "=== Admin Pages (require login) ==="
# First get a session cookie
COOKIE_FILE=$(mktemp)
curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"CloudWing2025!"}' > /dev/null

# Test admin pages with cookie
test_endpoint "Admin Dashboard" "/admin/dashboard" "200"
test_endpoint "Admin Products" "/admin/products" "200"
test_endpoint "Admin Inquiries" "/admin/inquiries" "200"
test_endpoint "Admin Categories" "/admin/categories" "200"
test_endpoint "Admin Analytics" "/admin/analytics" "200"
rm -f "$COOKIE_FILE"
echo ""

# 4. Static Assets
echo "=== Static Assets ==="
CSS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/_next/static/css/app/layout.css")
JS_MAIN=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/_next/static/chunks/main-app.js")
echo -n "CSS file... "
if [ "$CSS" = "200" ] || [ "$CSS" = "304" ]; then
  echo -e "${GREEN}✓${NC} layout.css → $CSS"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} layout.css → $CSS"
  ((FAILED++))
fi
echo -n "Main JS... "
if [ "$JS_MAIN" = "200" ] || [ "$JS_MAIN" = "304" ]; then
  echo -e "${GREEN}✓${NC} main-app.js → $JS_MAIN"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} main-app.js → $JS_MAIN"
  ((FAILED++))
fi
echo ""

# 5. Sitemap
echo "=== SEO ==="
SITEMAP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml")
echo -n "Sitemap... "
if [ "$SITEMAP" = "200" ]; then
  echo -e "${GREEN}✓${NC} sitemap.xml → 200"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} sitemap.xml → $SITEMAP"
  ((FAILED++))
fi
ROBOTS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt")
echo -n "Robots.txt... "
if [ "$ROBOTS" = "200" ]; then
  echo -e "${GREEN}✓${NC} robots.txt → 200"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} robots.txt → $ROBOTS"
  ((FAILED++))
fi
echo ""

# 6. Internationalization
echo "=== Internationalization ==="
# Test Chinese
ZH_CONTENT=$(curl -s -b "locale=zh-Hans" "$BASE_URL/" | grep -i "手机壳" || echo "not found")
if echo "$ZH_CONTENT" | grep -q "手机壳"; then
  echo -e "${GREEN}✓${NC} Chinese content loaded"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Chinese content not found"
  ((FAILED++))
fi
# Test Traditional Chinese
ZH_HANT_CONTENT=$(curl -s -b "locale=zh-Hant" "$BASE_URL/" | grep -i "手機殼" || echo "not found")
if echo "$ZH_HANT_CONTENT" | grep -q "手機殼"; then
  echo -e "${GREEN}✓${NC} Traditional Chinese content loaded"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Traditional Chinese content not found"
  ((FAILED++))
fi
echo ""

# Summary
echo "========================================"
echo "Summary"
echo "========================================"
TOTAL=$((PASSED + FAILED))
echo "Total tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please investigate.${NC}"
  exit 1
fi
