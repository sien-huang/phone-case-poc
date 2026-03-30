import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

function isError(e: unknown): e is Error {
  return e instanceof Error
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Seed Categories (from existing product categories)
  const categoriesSet = new Set<string>()

  try {
    const productsPath = join(process.cwd(), 'data', 'products.json')
    const products = JSON.parse(readFileSync(productsPath, 'utf-8'))

    products.forEach((p: any) => {
      if (p.category) categoriesSet.add(p.category)
    })

    console.log(`Found ${categoriesSet.size} unique categories`)

    for (const categoryName of categoriesSet) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          description: `${categoryName} phone cases`,
          order: 0,
          isActive: true,
        },
      })
      console.log(`  ✓ Category: ${categoryName}`)
    }
  } catch (error: any) {
    console.error('Failed to read products.json, skipping category seed:', error?.message || String(error))
  }

  // 2. Seed Sample Products (if products table empty)
  const productCount = await prisma.product.count()

  if (productCount === 0) {
    console.log('Products table empty, would you like to import from products.json?')
    console.log('(Run: npx tsx scripts/migrate-data.ts)')
  } else {
    console.log(`Products table already has ${productCount} records`)
  }

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
