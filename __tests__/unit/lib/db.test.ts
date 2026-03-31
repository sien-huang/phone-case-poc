import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Mock the adapter and client
jest.mock('@prisma/adapter-libsql')
jest.mock('@prisma/client', () => {
  const mockPrisma = jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $transaction: jest.fn(),
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  }))
  return { PrismaClient: mockPrisma }
})

describe('lib/db.ts - D1 Adapter Configuration', () => {
  beforeEach(() => {
    delete process.env.D1_DATABASE_URL
    delete process.env.CF_WORKER
    jest.clearAllMocks()
  })

  it('should initialize Prisma for local SQLite when no D1 env', async () => {
    // dynamic import to reset module state
    const { prisma } = await import('@/lib/db')

    expect(PrismaLibSql).not.toHaveBeenCalled()
  })

  it('should use D1 adapter when D1_DATABASE_URL is set', async () => {
    process.env.D1_DATABASE_URL = 'file:./d1-local.db'

    // Reset module to re-evaluate initialization
    jest.resetModules()

    const { prisma } = await import('@/lib/db')

    expect(PrismaLibSql).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'file:./d1-local.db' })
    )
  })

  it('should export prisma instance', async () => {
    const { prisma } = await import('@/lib/db')

    expect(prisma).toBeDefined()
    expect(prisma.product).toBeDefined()
    expect(prisma.category).toBeDefined()
  })
})
