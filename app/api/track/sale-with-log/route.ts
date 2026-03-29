import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface SaleLog {
  id: string
  productId: string
  productName: string
  quantity: number
  orderId?: string
  customerInfo?: any
  timestamp: string
}

export async function GET() {
  try {
    const logsPath = join(process.cwd(), 'data', 'sales-logs.json')
    const logs: SaleLog[] = []
    
    try {
      const data = readFileSync(logsPath, 'utf-8')
      logs.push(...JSON.parse(data))
    } catch {
      // 文件不存在时返回空数组
    }

    // 按时间倒序
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      total: logs.length,
      logs: logs.slice(0, 100), // 最近 100 条
    })
  } catch (error) {
    console.error('Failed to read sales logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity = 1, orderId, customerInfo } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // 读取产品数据
    const productsPath = join(process.cwd(), 'data', 'products.json')
    const products = JSON.parse(readFileSync(productsPath, 'utf-8'))
    const productIndex = products.findIndex((p: any) => p.id === productId || p.slug === productId)
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 更新产品销量
    products[productIndex].salesCount = (products[productIndex].salesCount || 0) + quantity
    products[productIndex].updated_at = new Date().toISOString()
    writeFileSync(productsPath, JSON.stringify(products, null, 2))

    // 记录销售日志
    const logEntry: SaleLog = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName: products[productIndex].name,
      quantity,
      orderId,
      customerInfo,
      timestamp: new Date().toISOString(),
    }

    const logsPath = join(process.cwd(), 'data', 'sales-logs.json')
    const existingLogs: SaleLog[] = []
    try {
      const logsData = readFileSync(logsPath, 'utf-8')
      existingLogs.push(...JSON.parse(logsData))
    } catch {
      // 文件不存在时创建
    }
    
    existingLogs.unshift(logEntry)
    writeFileSync(logsPath, JSON.stringify(existingLogs, null, 2))

    return NextResponse.json({ 
      success: true, 
      salesCount: products[productIndex].salesCount,
      logEntry 
    })
  } catch (error) {
    console.error('Track sale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}