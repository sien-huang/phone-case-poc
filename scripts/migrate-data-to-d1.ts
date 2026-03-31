#!/usr/bin/env tsx

/**
 * D1 数据迁移脚本
 *
 * 将本地 SQLite 数据库或 JSON 文件中的数据迁移到 Cloudflare D1
 *
 * 用法:
 *   D1_DATABASE_URL=file:./d1-local.db npx tsx scripts/migrate-data-to-d1.ts
 *
 * 或使用远程 D1：
 *   D1_DATABASE_URL=file:/path/to/d1.db npx tsx scripts/migrate-data-to-d1.ts
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 环境检查
const D1_DATABASE_URL = process.env.D1_DATABASE_URL
if (!D1_DATABASE_URL) {
  console.error('❌ 请设置 D1_DATABASE_URL 环境变量')
  console.error('   本地开发: D1_DATABASE_URL="file:./d1-local.db"')
  process.exit(1)
}

// 路径定义
const DATA_DIR = join(process.cwd(), 'data')
const PRODUCTS_FILE = join(DATA_DIR, 'products.json')
const INQUIRIES_FILE = join(DATA_DIR, 'inquiries.json')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')

// 初始化本地数据库（源）
const localPrisma = new PrismaClient()

// 初始化 D1（目标）
const d1Adapter = new PrismaLibSql({ url: D1_DATABASE_URL })
const d1Prisma = new PrismaClient({ adapter: d1Adapter })

async function migrate() {
  try {
    console.log('🚀 开始 D1 数据迁移...\n')

    // ========================================
    // 1. 迁移 Categories
    // ========================================
    console.log('📂 迁移分类数据...')

    // 优先从 categories.json 迁移
    if (existsSync(CATEGORIES_FILE)) {
      const rawCategories = JSON.parse(readFileSync(CATEGORIES_FILE, 'utf-8'))
      let migrated = 0

      for (const cat of rawCategories) {
        try {
          await d1Prisma.category.upsert({
            where: { name: cat.name },
            update: {
              description: cat.description || null,
              order: cat.order || 0,
              isActive: cat.is_active === 1 || cat.isActive !== false,
            },
            create: {
              id: cat.id || cat.name.toLowerCase().replace(/\s+/g, '-'),
              name: cat.name,
              description: cat.description || null,
              order: cat.order || 0,
              isActive: cat.is_active === 1 || cat.isActive !== false,
              productCount: cat.product_count || 0,
              totalViews: cat.total_views || 0,
              totalSales: cat.total_sales || 0,
            },
          })
          migrated++
        } catch (error) {
          console.error(`  ❌ 分类 ${cat.name} 迁移失败:`, error.message)
        }
      }

      console.log(`  ✅ 已迁移 ${migrated}/${rawCategories.length} 个分类（从 JSON）\n`)
    } else {
      // 从本地数据库获取
      const categories = await localPrisma.category.findMany()
      let migrated = 0

      for (const cat of categories) {
        try {
          await d1Prisma.category.upsert({
            where: { name: cat.name },
            update: {
              description: cat.description,
              order: cat.order,
              isActive: cat.isActive,
              productCount: cat.productCount,
              totalViews: cat.totalViews,
              totalSales: cat.totalSales,
            },
            create: {
              id: cat.id,
              name: cat.name,
              description: cat.description,
              order: cat.order,
              isActive: cat.isActive,
              productCount: cat.productCount,
              totalViews: cat.totalViews,
              totalSales: cat.totalSales,
            },
          })
          migrated++
        } catch (error) {
          console.error(`  ❌ 分类 ${cat.name} 迁移失败:`, error.message)
        }
      }

      console.log(`  ✅ 已迁移 ${migrated}/${categories.length} 个分类（从本地数据库）\n`)
    }

    // ========================================
    // 2. 迁移 Products
    // ========================================
    console.log('📦 迁移产品数据...')

    // 从本地数据库获取所有产品（包括非激活的）
    const products = await localPrisma.product.findMany()
    let migratedProducts = 0

    for (const product of products) {
      try {
        await d1Prisma.product.upsert({
          where: { id: product.id },
          update: {
            name: product.name,
            slug: product.slug,
            category: product.category,
            description: product.description,
            moq: product.moq,
            priceRange: product.priceRange,
            leadTime: product.leadTime,
            material: product.material,
            compatibility: product.compatibility,
            features: product.features,
            images: product.images,
            viewCount: product.viewCount,
            salesCount: product.salesCount,
            status: product.status,
            isActive: product.isActive,
            updatedAt: product.updatedAt,
          },
          create: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            description: product.description,
            moq: product.moq,
            priceRange: product.priceRange,
            leadTime: product.leadTime,
            material: product.material,
            compatibility: product.compatibility,
            features: product.features,
            images: product.images,
            viewCount: product.viewCount,
            salesCount: product.salesCount,
            status: product.status,
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          },
        })
        migratedProducts++
      } catch (error) {
        console.error(`  ❌ 产品 ${product.slug} 迁移失败:`, error.message)
      }
    }

    console.log(`  ✅ 已迁移 ${migratedProducts}/${products.length} 个产品\n`)

    // ========================================
    // 3. 迁移 Inquiries
    // ========================================
    console.log('📝 迁移询价数据...')

    const inquiries = await localPrisma.inquiry.findMany({
      include: {
        items: true,
        communications: true,
      },
    })
    let migratedInquiries = 0

    for (const inquiry of inquiries) {
      try {
        // 迁移询价主记录
        await d1Prisma.inquiry.upsert({
          where: { id: inquiry.id },
          update: {
            inquiryNumber: inquiry.inquiryNumber,
            status: inquiry.status,
            customerName: inquiry.customerName,
            customerEmail: inquiry.customerEmail,
            customerPhone: inquiry.customerPhone,
            customerCompany: inquiry.customerCompany,
            customerCountry: inquiry.customerCountry,
            customerWebsite: inquiry.customerWebsite,
            totalQuantity: inquiry.totalQuantity,
            estimatedTotal: inquiry.estimatedTotal,
            notes: inquiry.notes,
            assignedTo: inquiry.assignedTo,
            handledBy: inquiry.handledBy,
            respondedAt: inquiry.respondedAt,
            updatedAt: inquiry.updatedAt,
          },
          create: {
            id: inquiry.id,
            inquiryNumber: inquiry.inquiryNumber,
            status: inquiry.status,
            customerName: inquiry.customerName,
            customerEmail: inquiry.customerEmail,
            customerPhone: inquiry.customerPhone,
            customerCompany: inquiry.customerCompany,
            customerCountry: inquiry.customerCountry,
            customerWebsite: inquiry.customerWebsite,
            totalQuantity: inquiry.totalQuantity,
            estimatedTotal: inquiry.estimatedTotal,
            notes: inquiry.notes,
            assignedTo: inquiry.assignedTo,
            handledBy: inquiry.handledBy,
            createdAt: inquiry.createdAt,
            updatedAt: inquiry.updatedAt,
            respondedAt: inquiry.respondedAt,
          },
        })

        // 迁移询价项目
        for (const item of inquiry.items) {
          await d1Prisma.inquiryItem.upsert({
            where: { id: item.id },
            update: {
              inquiryId: item.inquiryId,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes,
              createdAt: item.createdAt,
            },
            create: {
              id: item.id,
              inquiryId: item.inquiryId,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes,
              createdAt: item.createdAt,
            },
          })
        }

        // 迁移沟通记录
        for (const comm of inquiry.communications) {
          await d1Prisma.inquiryCommunication.upsert({
            where: { id: comm.id },
            update: {
              inquiryId: comm.inquiryId,
              type: comm.type,
              direction: comm.direction,
              content: comm.content,
              metadata: comm.metadata,
              createdBy: comm.createdBy,
              createdAt: comm.createdAt,
            },
            create: {
              id: comm.id,
              inquiryId: comm.inquiryId,
              type: comm.type,
              direction: comm.direction,
              content: comm.content,
              metadata: comm.metadata,
              createdBy: comm.createdBy,
              createdAt: comm.createdAt,
            },
          })
        }

        migratedInquiries++
      } catch (error) {
        console.error(`  ❌ 询价 ${inquiry.inquiryNumber} 迁移失败:`, error.message)
      }
    }

    console.log(`  ✅ 已迁移 ${migratedInquiries}/${inquiries.length} 个询价（含 ${inquiries.reduce((sum, i) => sum + i.items.length, 0)} 个项目，${inquiries.reduce((sum, i) => sum + i.communications.length, 0)} 条沟通记录）\n`)

    // ========================================
    // 4. 迁移 Sale Logs
    // ========================================
    console.log('📈 迁移销售记录...')

    const saleLogs = await localPrisma.saleLog.findMany()
    let migratedSales = 0

    for (const log of saleLogs) {
      try {
        await d1Prisma.saleLog.upsert({
          where: { id: log.id },
          update: {
            productId: log.productId,
            productName: log.productName,
            quantity: log.quantity,
            orderId: log.orderId,
            customerInfo: log.customerInfo,
            createdAt: log.createdAt,
          },
          create: {
            id: log.id,
            productId: log.productId,
            productName: log.productName,
            quantity: log.quantity,
            orderId: log.orderId,
            customerInfo: log.customerInfo,
            createdAt: log.createdAt,
          },
        })
        migratedSales++
      } catch (error) {
        console.error(`  ❌ 销售记录 ${log.id} 迁移失败:`, error.message)
      }
    }

    console.log(`  ✅ 已迁移 ${migratedSales}/${saleLogs.length} 条销售记录\n`)

    // ========================================
    // 5. 迁移 System Logs（可选）
    // ========================================
    console.log('🔍 迁移系统日志...')

    const systemLogs = await localPrisma.systemLog.findMany()
    let migratedLogs = 0

    for (const log of systemLogs) {
      try {
        await d1Prisma.systemLog.create({
          data: {
            id: log.id,
            level: log.level,
            category: log.category,
            message: log.message,
            metadata: log.metadata,
            createdAt: log.createdAt,
          },
        })
        migratedLogs++
      } catch (error) {
        // 系统日志可能重复，忽略错误
        console.warn(`  ⚠️ 系统日志 ${log.id} 跳过:`, error.message)
      }
    }

    console.log(`  ✅ 已迁移 ${migratedLogs}/${systemLogs.length} 条系统日志\n`)

    // ========================================
    // 完成
    // ========================================
    console.log('✅ 迁移完成！')
    console.log(`\n📊 迁移统计:`)
    console.log(`   分类: ${migratedProducts} 个产品关联的分类`)
    console.log(`   产品: ${migratedProducts} 个`)
    console.log(`   询价: ${migratedInquiries} 个`)
    console.log(`   销售记录: ${migratedSales} 条`)
    console.log(`   系统日志: ${migratedLogs} 条`)

    // 验证数据
    console.log('\n🔍 验证 D1 数据库...')
    const d1ProductCount = await d1Prisma.product.count()
    const d1InquiryCount = await d1Prisma.inquiry.count()
    const d1CategoryCount = await d1Prisma.category.count()

    console.log(`   D1 产品数量: ${d1ProductCount}`)
    console.log(`   D1 询价数量: ${d1InquiryCount}`)
    console.log(`   D1 分类数量: ${d1CategoryCount}`)

    console.log('\n🎉 D1 数据迁移成功！')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await localPrisma.$disconnect()
    await d1Prisma.$disconnect()
  }
}

// 执行迁移
migrate()
