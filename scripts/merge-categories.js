#!/usr/bin/env node

/**
 * Merge new categories from products-generated.json into categories.json
 * Adds missing categories automatically
 */

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const DATA_DIR = join(process.cwd(), 'data')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')
const PRODUCTS_FILE = join(DATA_DIR, 'products-generated.json')

function main() {
  // Load existing categories
  let categories = []
  if (require('fs').existsSync(CATEGORIES_FILE)) {
    categories = JSON.parse(readFileSync(CATEGORIES_FILE, 'utf-8'))
  }

  // Load generated products to extract categories
  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf-8'))
  const productCategories = new Set(products.map(p => p.category))

  const existingNames = new Set(categories.map(c => c.name))
  const newCategories = []

  console.log(`📊 Existing categories: ${categories.length}`)
  console.log(`📦 Categories in products: ${productCategories.size}`)

  // Find missing categories
  for (const catName of productCategories) {
    if (!existingNames.has(catName)) {
      // Generate ID from name
      const id = catName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      newCategories.push({
        id,
        name: catName,
        description: `Products for ${catName}`,
        order: 999, // will need manual ordering
        is_active: 1,
        product_count: products.filter(p => p.category === catName).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log(`  ✨ New category: ${catName} (${products.filter(p => p.category === catName).length} products)`)
    }
  }

  if (newCategories.length === 0) {
    console.log('✅ No new categories to add')
  } else {
    categories.push(...newCategories)
    // Sort by name for readability
    categories.sort((a, b) => a.name.localeCompare(b.name))
    writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
    console.log(`✅ Added ${newCategories.length} new categories`)
    console.log(`📁 Total categories now: ${categories.length}`)
  }

  // Update product counts for all categories
  console.log('\n🔄 Updating product counts...')
  for (const cat of categories) {
    const count = products.filter(p => p.category === cat.name).length
    cat.product_count = count
  }
  writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
  console.log('✅ Product counts updated')
}

main()
