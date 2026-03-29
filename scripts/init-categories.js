#!/usr/bin/env node

/**
 * Initialize categories from preset data
 * Usage: node scripts/init-categories.js
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')

const DATA_DIR = join(process.cwd(), 'data')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')
const PRESET_FILE = join(DATA_DIR, 'categories-preset.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Read preset categories
const presetCategories = JSON.parse(readFileSync(PRESET_FILE, 'utf-8'))

// Add timestamps
const categories = presetCategories.map(cat => ({
  ...cat,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}))

// Write to categories.json
writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))

console.log(`✅ Successfully initialized ${categories.length} categories`)
console.log('📁 File:', CATEGORIES_FILE)
console.log('\nCategories created:')
categories.forEach(cat => {
  console.log(`  - ${cat.name} (${cat.id})`)
})
