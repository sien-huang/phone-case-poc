import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    // Cloudflare Workers 不支持文件系统写入
    // 临时方案：返回 NotImplemented，后续集成 R2 存储
    return NextResponse.json(
      {
        success: false,
        error: 'File upload is temporarily unavailable. Please configure R2 storage for production.',
        code: 'NOT_IMPLEMENTED'
      },
      { status: 501 }
    )

    // TODO: 实现 Cloudflare R2 上传
    // 1. 解析 multipart form-data
    // 2. 验证文件类型/大小
    // 3. 上传到 R2 bucket
    // 4. 在 Uploads 表中创建记录
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
