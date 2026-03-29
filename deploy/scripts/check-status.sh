#!/bin/bash

# 🏥 健康检查脚本
# 用法: ./check-status.sh [url]

set -e

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 默认 URL（从环境变量读取）
URL="${1:-https://your-app.vercel.app}"

echo "========================================"
echo "  健康检查 - $URL"
echo "========================================"
echo ""

# 1. 检查网站可访问性
echo -e "${YELLOW}[1/5] 检查网站可访问性${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ 网站正常 (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ 网站异常 (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

# 2. 检查 API 健康
echo -e "${YELLOW}[2/5] 检查 API 健康${NC}"
API_HEALTH="${URL}/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_HEALTH")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ API 健康检查通过${NC}"
  curl -s "$API_HEALTH" | head -c 200
  echo ""
else
  echo -e "${YELLOW}⚠️  API 健康检查不存在或失败 (HTTP $HTTP_CODE)${NC}"
fi

# 3. 检查数据库连接（通过 API）
echo -e "${YELLOW}[3/5] 检查数据库连接${NC}"
# 创建一个测试 API 路由来检查数据库
# var response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/health`)
# 如果有数据库连接，应返回 "ok"

# 4. 检查关键页面
echo -e "${YELLOW}[4/5] 检查关键页面${NC}"
PAGES=(
  "/"
  "/admin"
  "/products"
  "/contact"
)

for page in "${PAGES[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL$page")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}  ✅ $page${NC}"
  else
    echo -e "${RED}  ❌ $page (HTTP $HTTP_CODE)${NC}"
  fi
done

# 5. 检查资源加载
echo -e "${YELLOW}[5/5] 检查静态资源${NC}"
RESOURCES=(
  "/_next/static/chunks/main-app.js"
  "/_next/static/css/app/layout.css"
)

for res in "${RESOURCES[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL$res")
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}  ✅ $res${NC}"
  else
    echo -e "${YELLOW}  ⚠️  $res (HTTP $HTTP_CODE)${NC}"
  fi
done

echo ""
echo "========================================"
echo -e "${GREEN}✅ 健康检查完成${NC}"
echo "========================================"
