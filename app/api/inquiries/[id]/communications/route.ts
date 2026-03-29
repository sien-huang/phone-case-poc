import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// @ts-ignore
export async function POST(request: NextRequest, { params }: any) {
  try {
    const inquiryId = params.id
    const body = await request.json()
    const { type, content, created_by } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, content' },
        { status: 400 }
      )
    }

    // 读取询盘数据
    const inquiriesPath = join(process.cwd(), 'data', 'inquiries.json')
    const inquiries = JSON.parse(readFileSync(inquiriesPath, 'utf-8'))
    const inquiryIndex = inquiries.findIndex((i: any) => i.id === inquiryId)

    if (inquiryIndex === -1) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    const inquiry = inquiries[inquiryIndex]

    // 初始化 communications 数组
    if (!inquiry.communications) {
      inquiry.communications = []
    }

    // 添加新沟通记录
    const newCommunication = {
      id: `comm-${Date.now()}`,
      type: type || 'note', // note, email, call, quote
      content,
      created_by: created_by || 'admin',
      created_at: new Date().toISOString(),
    }

    inquiry.communications.unshift(newCommunication)
    inquiry.updated_at = new Date().toISOString()

    // 保存
    writeFileSync(inquiriesPath, JSON.stringify(inquiries, null, 2))

    return NextResponse.json(
      { success: true, communication: newCommunication },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to add communication:', error)
    return NextResponse.json(
      { error: 'Failed to add communication' },
      { status: 500 }
    )
  }
}