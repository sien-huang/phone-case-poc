#!/usr/bin/env tsx

/**
 * 从 data/*.json 文件导出数据为 SQL INSERT 语句
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const PRODUCTS_FILE = join(DATA_DIR, 'products.json')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')
const INQUIRIES_FILE = join(DATA_DIR, 'inquiries.json')

function escapeSql(str: string): string {
  return str.replace(/'/g, "''")
}

function now(): string {
  return new Date().toISOString()
}

async function exportSQL() {
  try {
    console.log('📤 导出 SQL 数据...\n')
    let sql = ''

    // Categories
    if (existsSync(CATEGORIES_FILE)) {
      console.log('📂 categories...')
      const cats = JSON.parse(readFileSync(CATEGORIES_FILE, 'utf-8'))
      for (const cat of cats) {
        if (!cat.name) continue
        const id = cat.id || cat.name.toLowerCase().replace(/\s+/g, '-')
        const name = escapeSql(cat.name)
        const desc = cat.description ? `'${escapeSql(cat.description)}'` : 'NULL'
        const order = cat.order || 0
        const isActive = cat.is_active === 0 ? 'false' : 'true'
        const pc = cat.product_count || 0
        const tv = cat.total_views || 0
        const ts = cat.total_sales || 0
        const created = now()
        const updated = now()

        sql += `INSERT INTO "categories" (id, name, description, "order", "isActive", productCount, totalViews, totalSales, createdAt, updatedAt) VALUES ('${id}', '${name}', ${desc}, ${order}, ${isActive}, ${pc}, ${tv}, ${ts}, '${created}', '${updated}');\n`
      }
      console.log(`  ✅ ${cats.length}\n`)
    }

    // Products
    if (existsSync(PRODUCTS_FILE)) {
      console.log('📦 products...')
      const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf-8'))
      for (const p of products) {
        if (!p.id || !p.slug) continue

        const id = p.id
        const name = escapeSql(p.name)
        const slug = escapeSql(p.slug)
        const category = escapeSql(p.category)
        const desc = p.description ? `'${escapeSql(p.description)}'` : 'NULL'
        const moq = p.moq || 0
        const priceRange = escapeSql(p.priceRange || p.price_range || '$0.00')
        const leadTime = p.leadTime ? `'${escapeSql(p.leadTime)}'` : 'NULL'
        const material = p.material ? `'${escapeSql(p.material)}'` : 'NULL'
        const compatibility = JSON.stringify(p.compatibility || p.compatible_models || []).replace(/'/g, "''")
        const features = JSON.stringify(p.features || []).replace(/'/g, "''")
        const images = JSON.stringify(p.images || []).replace(/'/g, "''")
        const viewCount = p.viewCount || p.views || 0
        const salesCount = p.salesCount || p.sales || 0
        const status = p.status === 'draft' ? 'DRAFT' : p.status === 'archived' ? 'ARCHIVED' : 'ACTIVE'
        const isActive = p.is_active !== 0 ? 'true' : 'false'
        const created = p.created_at || p.createdAt || now()
        const updated = p.updated_at || p.updatedAt || now()

        sql += `INSERT INTO "products" (id, name, slug, category, description, moq, priceRange, leadTime, material, compatibility, features, images, viewCount, salesCount, status, "isActive", createdAt, updatedAt) VALUES ('${id}', '${name}', '${slug}', '${category}', ${desc}, ${moq}, '${priceRange}', ${leadTime}, ${material}, '${compatibility}', '${features}', '${images}', ${viewCount}, ${salesCount}, '${status}', ${isActive}, '${created}', '${updated}');\n`
      }
      console.log(`  ✅ ${products.length}\n`)
    }

    // Inquiries
    if (existsSync(INQUIRIES_FILE)) {
      console.log('📝 inquiries...')
      const inquiries = JSON.parse(readFileSync(INQUIRIES_FILE, 'utf-8'))
      let itemCount = 0

      for (const i of inquiries) {
        if (!i.id) continue

        const id = i.id
        const inquiryNumber = escapeSql(i.inquiryNumber || i.inquiry_number || `INV-${i.id.slice(0,8)}`)
        const status = i.status === 'confirmed' ? 'CONFIRMED' : i.status === 'cancelled' ? 'CANCELLED' : i.status === 'quoted' ? 'QUOTED' : 'PENDING'
        const customerName = escapeSql(i.customerName || i.customer_name || '')
        const customerEmail = escapeSql(i.customerEmail || i.customer_email || '')
        const customerPhone = i.customerPhone ? `'${escapeSql(i.customerPhone)}'` : 'NULL'
        const customerCompany = i.customerCompany ? `'${escapeSql(i.customerCompany)}'` : 'NULL'
        const customerCountry = i.customerCountry ? `'${escapeSql(i.customerCountry)}'` : 'NULL'
        const customerWebsite = i.customerWebsite ? `'${escapeSql(i.customerWebsite)}'` : 'NULL'
        const totalQuantity = i.totalQuantity || i.total_quantity || 0
        const estimatedTotal = i.estimatedTotal || i.estimated_total || 'NULL'
        const notes = i.notes ? `'${escapeSql(i.notes)}'` : 'NULL'
        const created = i.created_at || i.createdAt || now()
        const updated = i.updated_at || i.updatedAt || now()
        const respondedAt = i.respondedAt ? `'${i.respondedAt}'` : 'NULL'

        sql += `INSERT INTO "inquiries" (id, inquiryNumber, status, customerName, customerEmail, customerPhone, customerCompany, customerCountry, customerWebsite, totalQuantity, estimatedTotal, notes, assignedTo, handledBy, createdAt, updatedAt, respondedAt) VALUES ('${id}', '${inquiryNumber}', '${status}', '${customerName}', '${customerEmail}', ${customerPhone}, ${customerCompany}, ${customerCountry}, ${customerWebsite}, ${totalQuantity}, ${estimatedTotal}, ${notes}, NULL, NULL, '${created}', '${updated}', ${respondedAt});\n`

        // Items
        if (i.items && Array.isArray(i.items)) {
          for (const item of i.items) {
            const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
            const productId = item.productId ? `'${item.productId}'` : 'NULL'
            const productName = escapeSql(item.productName || item.product_name || '')
            const quantity = item.quantity || 0
            const unitPrice = item.unitPrice || item.unit_price || 'NULL'
            const itemNotes = item.notes ? `'${escapeSql(item.notes)}'` : 'NULL'

            sql += `INSERT INTO "inquiry_items" (id, inquiryId, productId, productName, quantity, unitPrice, notes, createdAt) VALUES ('${itemId}', '${id}', ${productId}, '${productName}', ${quantity}, ${unitPrice}, ${itemNotes}, '${now()}');\n`
            itemCount++
          }
        }
      }
      console.log(`  ✅ ${inquiries.length} 个询价, ${itemCount} 个项目\n`)
    }

    // Write
    const outputFile = join(process.cwd(), 'data-inserts.sql')
    const { writeFileSync } = await import('fs')
    writeFileSync(outputFile, sql)
    console.log('✅ SQL 文件生成: data-inserts.sql')
    console.log(`   总计 ${sql.split('INSERT INTO').length - 1} 条 INSERT 语句\n`)
    console.log('🚀 执行迁移:')
    console.log('  npx wrangler d1 execute phone_case_poc_db --file=data-inserts.sql --remote --yes')

  } catch (error) {
    console.error('\n❌ 失败:', error)
    process.exit(1)
  }
}

exportSQL()
