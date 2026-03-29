const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const dataPath = join(process.cwd(), 'data', 'products.json')
const products = JSON.parse(readFileSync(dataPath, 'utf-8'))

let migrated = 0

products.forEach((product) => {
  if (!product.price_tiers) {
    // 从 priceRange 提取价格区间
    const priceRange = product.priceRange || ''
    const match = priceRange.match(/\$?([\d.]+)\s*-\s*\$?([\d.]+)/)
    
    if (match) {
      const minPrice = parseFloat(match[1])
      const maxPrice = parseFloat(match[2])
      
      if (minPrice && maxPrice) {
        // 标准价格阶梯：根据 MOQ 设置
        const tiers = [
          { minQty: product.moq || 500, price: minPrice, label: `MOQ ${product.moq || 500}` },
          { minQty: 1000, price: (minPrice + maxPrice) / 2, label: '1,000 pcs' },
          { minQty: 5000, price: maxPrice, label: '5,000 pcs' },
        ]
        
        product.price_tiers = tiers
        migrated++
      }
    }
  }
})

writeFileSync(dataPath, JSON.stringify(products, null, 2))

console.log(`✅ Migration complete. Added price_tiers to ${migrated} products.`)