#!/usr/bin/env tsx

/**
 * 初始化本地 D1 数据库
 */

import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const DB_PATH = join(process.cwd(), 'd1-local.db')
const MIGRATION_SQL = join(process.cwd(), 'prisma/migrations/20260331103736_d1_init/migration.sql')

async function init() {
  try {
    console.log('🗄️  初始化本地 D1 数据库...')

    // 1. 删除已存在的旧数据库
    if (existsSync(DB_PATH)) {
      unlinkSync(DB_PATH)
      console.log(`✅ 已删除旧数据库: ${DB_PATH}`)
    }

    // 2. 直接通过 sqlite3 应用迁移（不需要 LibSQL 客户端）
    console.log('📝 应用数据库 schema...')
    const sql = readFileSync(MIGRATION_SQL, 'utf-8')

    // 使用 better-sqlite3 创建数据库并执行 SQL
    const Database = require('better-sqlite3')
    const db = new Database(DB_PATH)
    db.exec(sql)
    db.close()

    console.log('✅ Schema 应用完成！')

    // 3. 通过 Prisma LibSQL Adapter 验证连接
    console.log('🔍 验证 D1 连接...')
    const libsqlClient = createClient({ url: `file:${DB_PATH}` })
    const adapter = new PrismaLibSql(libsqlClient)
    const prisma = new PrismaClient({ adapter })

    const productCount = await prisma.product.count()
    const categoryCount = await prisma.category.count()

    console.log(`✅ 连接成功！`)
    console.log(`   产品表: ${productCount} 条记录`)
    console.log(`   分类表: ${categoryCount} 条记录`)

    await prisma.$disconnect()

    console.log('\n🎉 本地 D1 数据库初始化完成！')
    console.log(`\n📋 后续步骤:`)
    console.log(`1. 设置环境变量: D1_DATABASE_URL="file:./d1-local.db"`)
    console.log(`2. 运行数据迁移: D1_DATABASE_URL="file:./d1-local.db" npx tsx scripts/migrate-data-to-d1.ts`)
    console.log(`3. 启动开发服务器: npm run dev`)

  } catch (error) {
    console.error('\n❌ 初始化失败:', error)
    process.exit(1)
  }
}

init()
