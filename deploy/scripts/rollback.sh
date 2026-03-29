#!/bin/bash

# 🔄 回滚脚本
# 用法: ./rollback.sh [deployment-id]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  回滚 Vercel 部署"
echo "========================================"
echo ""

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ 需要安装 Vercel CLI${NC}"
  echo "安装: npm i -g vercel"
  exit 1
fi

# 获取项目
echo -e "${YELLOW}[1/3] 获取部署历史...${NC}"
vercel ls

echo ""
read -p "输入要回滚的 Deployment ID (留空回滚到上一个): " DEPLOY_ID

# 回滚
echo -e "${YELLOW}[2/3] 执行回滚...${NC}"
if [ -z "$DEPLOY_ID" ]; then
  vercel rollback
else
  vercel rollback "$DEPLOY_ID"
fi

echo -e "${GREEN}✅ 回滚完成${NC}"
echo ""
echo -e "${YELLOW}[3/3] 清理缓存...${NC}"
vercel inspect --prod 2>/dev/null | head -5

echo ""
echo "========================================"
echo -e "${GREEN}🎉 已回滚到上一个稳定版本${NC}"
echo "========================================"
