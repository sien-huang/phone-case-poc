#!/bin/bash

# Database Migration Script for CloudWing POC
# Usage: ./scripts/migrate.sh [up|down|reset|status]

set -e

echo "🗄️  CloudWing Database Migration"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  echo "Please set it in your shell or .env file:"
  echo "  export DATABASE_URL=\"postgresql://username:password@localhost:5432/cloudwing_db\""
  exit 1
fi

# Function to run prisma command with npx
run_prisma() {
  echo "🚀 Running: prisma $@"
  npx prisma "$@"
}

case "$1" in
  "up" | "migrate")
    echo "📤 Applying migrations..."
    run_prisma migrate deploy
    echo "✅ Migrations applied successfully"
    ;;

  "dev")
    echo "🔨 Creating development migration..."
    run_prisma migrate dev --name init
    ;;

  "reset")
    echo "⚠️  WARNING: This will DROP all database data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      run_prisma migrate reset --force
      echo "✅ Database reset complete"
    else
      echo "❌ Cancelled"
      exit 1
    fi
    ;;

  "studio")
    echo "🎨 Opening Prisma Studio..."
    run_prisma studio
    ;;

  "status")
    echo "📊 Migration status:"
    run_prisma migrate status
    ;;

  "generate")
    echo "🔧 Generating Prisma Client..."
    run_prisma generate
    echo "✅ Prisma Client generated"
    ;;

  *)
    echo "Usage: $0 {up|dev|reset|studio|status|generate}"
    echo ""
    echo "Commands:"
    echo "  up        Apply pending migrations"
    echo "  dev       Create a new migration (development)"
    echo "  reset     Drop database and reapply all migrations"
    echo "  studio    Open Prisma Studio (GUI)"
    echo "  status    Show migration status"
    echo "  generate  Regenerate Prisma Client"
    exit 1
    ;;
esac
