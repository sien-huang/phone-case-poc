#!/bin/bash

# 🚀 Phone Case POC - Vercel 一键部署脚本
# 用法: ./deploy.sh [--skip-build] [--skip-migrate]

set -e  # 遇到错误退出

echo "========================================"
echo "  Phone Case POC - Vercel 部署脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/home/kirk/.openclaw/agents/fullstack-expert/workspace/phone-case-poc"
ENV_FILE="${PROJECT_DIR}/.env.vercel"

# 参数
SKIP_BUILD=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    *) echo "未知参数: $arg" && exit 1 ;;
  esac
done

# 1. 检查环境变量文件
echo -e "${YELLOW}[1/5] 检查环境变量...${NC}"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ 未找到 .env.vercel 文件${NC}"
  echo "请复制 deploy/.env.vercel.example 并填写真实值"
  exit 1
fi

# 检查 DATABASE_URL
if grep -q "postgresql://" "$ENV_FILE"; then
  echo -e "${GREEN}✅ DATABASE_URL 已配置${NC}"
else
  echo -e "${RED}❌ DATABASE_URL 未配置或格式错误${NC}"
  exit 1
fi

# 2. 检查 Git 状态
echo -e "${YELLOW}[2/5] 检查 Git 状态...${NC}"
cd "$PROJECT_DIR"

if [ -d ".git" ]; then
  echo -e "${GREEN}✅ Git 仓库存在${NC}"
  UNCOMMITTED=$(git status --porcelain | wc -l)
  if [ "$UNCOMMITTED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  有未提交的更改 ($UNCOMMITTED 个文件)${NC}"
    read -p "是否自动提交? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git add .
      git commit -m "deploy: auto commit before deployment"
      echo -e "${GREEN}✅ 已提交${NC}"
    else
      echo -e "${RED}❌ 请手动提交更改后重试${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}⚠️  非 Git 仓库，跳过提交检查${NC}"
fi

# 3. 推送到 GitHub（如果需要）
echo -e "${YELLOW}[3/5] Git 推送检查${NC}"
if git remote | grep -q origin; then
  echo -e "${GREEN}✅ 检测到 origin remote${NC}"
  read -p "是否推送最新代码到 GitHub? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main || git push origin master
    echo -e "${GREEN}✅ 推送成功${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  未检测到 remote，跳过推送${NC}"
fi

# 4. Vercel 部署
echo -e "${YELLOW}[4/5] Vercel 部署${NC}"

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI 未安装，尝试使用 npx${NC}"
  VERCEL_CMD="npx vercel"
else
  VERCEL_CMD="vercel"
fi

if [ "$SKIP_BUILD" = false ]; then
  echo "正在部署到 Vercel..."
  $VERCEL_CMD --prod --yes

  echo -e "${GREEN}✅ Vercel 部署完成${NC}"
else
  echo -e "${YELLOW}⏭️  跳过构建（--skip-build）${NC}"
fi

# 5. 数据库迁移
echo -e "${YELLOW}[5/5] 数据库迁移${NC}"

if [ "$SKIP_MIGRATE" = false ]; then
  echo "执行 Prisma 迁移..."

  # 方法 A: 使用 Vercel CLI
  if command -v vercel &> /dev/null; then
    vercel env pull .env.vercel 2>/dev/null || true
  fi

  # 加载环境变量
  export $(cat $ENV_FILE | grep -v '^#' | xargs)

  # 执行迁移
  npm run db:deploy

  echo -e "${GREEN}✅ 数据库迁移完成${NC}"
else
  echo -e "${YELLOW}⏭️  跳过迁移（--skip-migrate）${NC}"
  echo "记得手动运行: npm run db:deploy"
fi

# 总结
echo ""
echo "========================================"
echo -e "${GREEN}🎉 部署流程全部完成！${NC}"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 访问你的 Vercel 域名"
echo "2. 测试所有功能"
echo "3. 如有问题，查看日志: vercel logs [app-name] --prod"
echo ""
