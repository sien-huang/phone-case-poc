#!/usr/bin/env tsx

/**
 * 远程 D1 数据迁移
 *
 * 从本地 SQLite dev.db 读取数据，通过 HTTP API 写入远程 D1
 * 
 * 用法:
 *   npx tsx scripts/migrate-data-to-d1-remote.ts
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// 本地数据库（源）
const localPrisma = new PrismaClient()

// 远程 D1（目标） - 通过 wrangler 的远程连接
// 注意：需要 D1_DATABASE_URL 环境变量指向远程数据库
const D1_URL = process.env.D1_DATABASE_URL

if (!D1_URL) {
  console.error('❌ 请设置 D1_DATABASE_URL 环境变量')
  console.error('   示例: D1_DATABASE_URL="file:./d1-local.db" npx tsx ...')
  console.error('   或使用远程 D1 连接（通过 Cloudflare API）')
  process.exit(1)
}

// 连接远程 D1
const d1Adapter = new PrismaLibSql({ 
  url: D1_URL,
  // 如果使用远程 D1，可能需要 authToken
  authToken: process.env.D1_AUTH_TOKEN 
})
const d1Prisma = new PrismaClient({ adapter: d1Adapter })

async function migrate() {
  try {
    console.log('🚀 开始远程 D1 数据迁移...\n')

    // 测试连接
    console.log('🔌 测试远程 D1 连接...')
    const testCount = await d1Prisma.product.count()
    console.log(`✅ 连接成功，当前产品数: ${testCount}\n`)

    // ========================================
    // 1. 迁移 Categories
    // ========================================
    console.log('📂 迁移分类...')
    const categories = await localPrisma.category.findMany()
    let migratedCats = 0

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
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
          },
        })
        migratedCats++
      } catch (error: any) {
        console.error(`  ❌ 分类 ${cat.name}:`, error?.message || error)
      }
    }
    console.log(`  ✅ 迁移 ${migratedCats}/${categories.length} 个分类\n`)

    // ========================================
    // 2. 迁移 Products
    // ========================================
    console.log('📦 迁移产品...')
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
      } catch (error: any) {
        console.error(`  ❌ 产品 ${product.slug}:`, error?.message || error)
      }
    }
    console.log(`  ✅ 迁移 ${migratedProducts}/${products.length} 个产品\n`)

    // ========================================
    // 3. 迁移 Inquiries
    // ========================================
    console.log('📝 迁移询价...')
    const inquiries = await localPrisma.inquiry.findMany({
      include: {
        items: true,
        communications: true,
      },
    })
    let migratedInquiries = 0

    for (const inquiry of inquiries) {
      try {
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

        // Items
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

        // Communications
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
      } catch (error: any) {
        console.error(`  ❌ 询价 ${inquiry.inquiryNumber}:`, error?.message || error)
      }
    }
    console.log(`  ✅ 迁移 ${migratedInquiries}/${inquiries.length} 个询价\n`)

    // ========================================
    // 4. 迁移 SaleLogs
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
      } catch (error: any) {
        console.error(`  ❌ 销售记录 ${log.id}:`, error?.message || error)
      }
    }
    console.log(`  ✅ 迁移 ${migratedSales}/${saleLogs.length} 条销售记录\n`)

    // ========================================
    // 完成
    // ========================================
    console.log('✅ 迁移完成！')
    console.log(`\n📊 统计:`)
    console.log(`  分类: ${migratedCats}`)
    console.log(`  产品: ${migratedProducts}`)
    console.log(`  询价: ${migratedInquiries}`)
    console.log(`  销售: ${migratedSales}`)

    // 验证
    console.log('\n🔍 验证远程 D1...')
    const d1Stats = {
      products: await d1Prisma.product.count(),
      categories: await d1Prisma.category.count(),
      inquiries: await d1Prisma.inquiry.count(),
    }
    console.log('  远程 D1 数据:', d1Stats)

    console.log('\n🎉 数据迁移成功！')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await localPrisma.$disconnect()
    await d1Prisma.$disconnect()
  }
}

migrate()
