import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { R2Bucket } from '@cloudflare/workers-types'

// R2 bucket binding (configured in wrangler.jsonc)
declare global {
  var UPLOADS: R2Bucket
}

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    // Check if R2 bucket is configured
    const bucket = process.env.UPLOADS as any || (globalThis as any).UPLOADS
    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 storage not configured. Set UPLOADS bucket binding.' },
        { status: 503 }
      )
    }

    // Parse multipart form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
    const key = `uploads/${filename}`

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer()
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: 'admin',
      },
    })

    // Return relative URL (used in frontend)
    const url = `/uploads/${filename}`

    // NOTE: UploadMetadata table not implemented in D1 migration.
    // Database logging can be added later if needed.

    return NextResponse.json({ success: true, url, filename })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 }
    )
  }
}
