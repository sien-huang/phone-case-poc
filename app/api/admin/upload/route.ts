import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WebP, PDF allowed.' }, 
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB.' }, 
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/\s+/g, '_')
    const safeName = `${timestamp}-${originalName}`
    
    // Determine upload directory based on optional 'type' field
    const uploadType = formData.get('type') as string || 'general'
    let uploadDir
    
    if (uploadType === 'product') {
      uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
    } else if (uploadType === 'attachment') {
      uploadDir = join(process.cwd(), 'data', 'attachments')
    } else {
      uploadDir = join(process.cwd(), 'public', 'uploads', 'general')
    }

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, safeName)
    await writeFile(filePath, buffer)

    // Return relative path for web access
    let webPath
    if (uploadType === 'product') {
      webPath = `/uploads/products/${safeName}`
    } else if (uploadType === 'attachment') {
      webPath = `/data/attachments/${safeName}`
    } else {
      webPath = `/uploads/general/${safeName}`
    }

    return NextResponse.json({
      success: true,
      url: webPath,
      filename: safeName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    )
  }
}
