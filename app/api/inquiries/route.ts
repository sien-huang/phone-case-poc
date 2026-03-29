import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { sendInquiryNotification } from '@/lib/email'

const INQUIRIES_PATH = join(process.cwd(), 'data', 'inquiries.json')

// 读取询盘数据
function readInquiries() {
  try {
    const data = readFileSync(INQUIRIES_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// 写入询盘数据
function writeInquiries(inquiries: any[]) {
  writeFileSync(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let inquiries = readInquiries()
    
    // 过滤：只保留有 customer 对象的新格式数据
    inquiries = inquiries.filter((i: any) => i.customer && typeof i.customer === 'object')
    
    // 筛选
    if (status) {
      inquiries = inquiries.filter((i: any) => i.status === status)
    }
    
    // 限制数量
    inquiries = inquiries.slice(0, limit)
    
    return NextResponse.json({
      total: inquiries.length,
      inquiries,
    })
  } catch (error) {
    console.error('Failed to fetch inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 验证必填字段
    const { customer, items } = body
    if (!customer?.email || !items?.length) {
      return NextResponse.json(
        { error: 'Email and at least one product are required' },
        { status: 400 }
      )
    }

    // 读取现有数据
    let inquiries = readInquiries()

    // 计算汇总信息
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
    
    // 计算预计总价（优先使用前端传来的 unitPrice）
    let estimatedTotal = 0
    items.forEach((item: any) => {
      if (item.unitPrice) {
        estimatedTotal += item.unitPrice * (item.quantity || 1)
      } else {
        // 回退：从产品数据中提取价格
        try {
          const productsPath = join(process.cwd(), 'data', 'products.json')
          const products = JSON.parse(readFileSync(productsPath, 'utf-8'))
          const product = products.find((p: any) => p.id === item.productId)
          if (product) {
            const priceMatch = product.priceRange.match(/\$?([\d.]+)/)
            if (priceMatch) {
              const unitPrice = parseFloat(priceMatch[1])
              estimatedTotal += unitPrice * (item.quantity || 1)
            }
          }
        } catch (error: any) {
          console.log('Could not calculate estimated total from product:', error.message)
        }
      }
    })
    
    // 创建新询盘
    const newInquiry = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      user_id: body.user_id || null, // 关联用户（如已登录）
      customer: {
        name: customer.name || '',
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone || '',
        country: customer.country || '',
        website: customer.website || '',
      },
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName || item.productId,
        quantity: item.quantity || 1,
        notes: item.notes || '',
        unitPrice: item.unitPrice || null,
      })),
      summary: {
        totalQuantity,
        estimatedTotal,
        leadTime: '5-10 business days (estimated)',
        shippingMethod: '',
        notes: body.notes || '',
      },
      assignedTo: null,
      communications: [
        {
          type: 'note',
          content: 'Inquiry created via website',
          created_by: 'system',
          created_at: new Date().toISOString(),
        }
      ],
    }

    // 保存
    inquiries.unshift(newInquiry)
    writeInquiries(inquiries)

    // 发送邮件通知
    try {
      await sendInquiryNotification(newInquiry)
    } catch (emailError) {
      console.log('⚠️  Email not sent:', emailError instanceof Error ? emailError.message : String(emailError))
    }

    return NextResponse.json(
      { success: true, inquiry: newInquiry },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}