#!/usr/bin/env node

/**
 * Import products from JSON or CSV file
 * Usage: node scripts/import-products.js <file_path>
 *
 * Supported formats:
 * - JSON: array of product objects
 * - CSV: header row with field names
 *
 * Example JSON:
 * [
 *   {
 *     "id": "iphone15-classic",
 *     "name": "iPhone 15 Classic Case",
 *     "category": "iPhone 15 Series",
 *     ...
 *   }
 * ]
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')
const { parse } = require('csv-parse/sync')

const DATA_DIR = join(process.cwd(), 'data')
const PRODUCTS_FILE = join(DATA_DIR, 'products.json')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadExistingProducts() {
  if (existsSync(PRODUCTS_FILE)) {
    return JSON.parse(readFileSync(PRODUCTS_FILE, 'utf-8'))
  }
  return []
}

function saveProducts(products) {
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
  console.log(`✅ Saved ${products.length} products to ${PRODUCTS_FILE}`)
}

function normalizeProduct(product, index) {
  // Generate ID if missing
  if (!product.id) {
    product.id = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`
  }

  // Generate slug if missing
  if (!product.slug) {
    product.slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // Ensure arrays
  product.compatibility = product.compatibility || []
  product.images = product.images || []
  product.features = product.features || []

  // Set defaults
  product.moq = product.moq || 500
  product.leadTime = product.leadTime || '7-10 business days'
  product.priceRange = product.priceRange || 'Contact for price'
  product.material = product.material || 'TPU'
  product.finish = product.finish || ''
  product.thickness = product.thickness || ''
  product.patent = product.patent || ''
  product.description = product.description || ''
  product.fullDescription = product.fullDescription || product.description
  product.is_active = product.is_active !== undefined ? product.is_active : 1
  product.created_at = product.created_at || new Date().toISOString()
  product.updated_at = new Date().toISOString()

  return product
}

function importJSON(filePath) {
  console.log(`📖 Reading JSON file: ${filePath}`)
  const content = readFileSync(filePath, 'utf-8')
  const rawProducts = JSON.parse(content)

  if (!Array.isArray(rawProducts)) {
    throw new Error('JSON must contain an array of products')
  }

  console.log(`📥 Found ${rawProducts.length} products in file`)

  const existingProducts = loadExistingProducts()
  const existingIds = new Set(existingProducts.map(p => p.id))
  let imported = 0
  let skipped = 0

  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i]
    const product = normalizeProduct(raw, i)

    // Check if product already exists (by id or slug)
    if (existingIds.has(product.id)) {
      console.log(`  ⚠️  Skipping duplicate: ${product.name} (id: ${product.id})`)
      skipped++
      continue
    }

    if (product.slug && existingProducts.some(p => p.slug === product.slug)) {
      console.log(`  ⚠️  Skipping duplicate slug: ${product.slug}`)
      skipped++
      continue
    }

    existingProducts.push(product)
    imported++
    console.log(`  ✅ Imported: ${product.name} (${product.category})`)
  }

  saveProducts(existingProducts)

  return { imported, skipped, total: existingProducts.length }
}

function importCSV(filePath) {
  console.log(`📖 Reading CSV file: ${filePath}`)
  const content = readFileSync(filePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })

  console.log(`📥 Found ${records.length} products in file`)

  const existingProducts = loadExistingProducts()
  const existingIds = new Set(existingProducts.map(p => p.id))
  let imported = 0
  let skipped = 0

  for (let i = 0; i < records.length; i++) {
    const raw = records[i]

    // Convert CSV fields to proper types
    const product = {}
    for (const [key, value] of Object.entries(raw)) {
      if (value === '' || value === null) continue

      // Parse JSON array fields (compatibility, images, features)
      if (key === 'compatibility' || key === 'images' || key === 'features') {
        try {
          product[key] = JSON.parse(value)
        } catch {
          // Fallback: split by newline or comma
          product[key] = value.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
        }
      } else if (key === 'moq' || key === 'order') {
        product[key] = parseInt(value, 10)
      } else {
        product[key] = value
      }
    }

    const normalized = normalizeProduct(product, i)

    // Check duplicates
    if (existingIds.has(normalized.id)) {
      console.log(`  ⚠️  Skipping duplicate: ${normalized.name}`)
      skipped++
      continue
    }

    existingProducts.push(normalized)
    imported++
    console.log(`  ✅ Imported: ${normalized.name} (${normalized.category})`)
  }

  saveProducts(existingProducts)

  return { imported, skipped, total: existingProducts.length }
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Please provide a file path')
    console.error('Usage: node scripts/import-products.js <file_path>')
    process.exit(1)
  }

  const filePath = args[0]

  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }

  try {
    ensureDataDir()

    const ext = filePath.split('.').pop().toLowerCase()
    let result

    if (ext === 'json') {
      result = importJSON(filePath)
    } else if (ext === 'csv') {
      result = importCSV(filePath)
    } else {
      console.error('❌ Unsupported file format. Use .json or .csv')
      process.exit(1)
    }

    console.log('\n📊 Import Summary:')
    console.log(`   Imported: ${result.imported}`)
    console.log(`   Skipped (duplicates): ${result.skipped}`)
    console.log(`   Total products in database: ${result.total}`)

  } catch (error) {
    console.error('❌ Import failed:', error.message)
    process.exit(1)
  }
}

main()
