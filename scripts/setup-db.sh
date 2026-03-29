#!/bin/bash

# CloudWing Database Setup Script
# Run this after provisioning PostgreSQL database

set -e

echo "🗄️  CloudWing Database Setup"
echo "============================"
echo ""

# Check prerequisites
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL client (psql) not found. Please install PostgreSQL first."
  exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set. Please set it in .env.local:"
  echo "  DATABASE_URL=\"postgresql://username:password@localhost:5432/cloudwing_db\""
  exit 1
fi

# Extract DB connection details from DATABASE_URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
  DB_USER=${BASH_REMATCH[1]}
  DB_PASS=${BASH_REMATCH[2]}
  DB_HOST=${BASH_REMATCH[3]}
  DB_PORT=${BASH_REMATCH[4]}
  DB_NAME=${BASH_REMATCH[5]}
else
  echo "❌ Invalid DATABASE_URL format"
  exit 1
fi

echo "📋 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test connection
echo "🔌 Testing connection..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Connection successful"
else
  echo "❌ Connection failed. Check your DATABASE_URL."
  exit 1
fi

# Create database if it doesn't exist
echo "🏗️  Creating database '$DB_NAME' if it doesn't exist..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME"
echo "✅ Database ready"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Run seed data
echo "🌱 Seeding initial data..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Test connection: npm run db:studio"
echo "  2. Start app: npm run dev"
echo ""
