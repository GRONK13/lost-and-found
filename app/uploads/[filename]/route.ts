import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    // Try primary public/uploads location first
    const primaryPath = path.join(process.cwd(), 'public', 'uploads', filename)
    // Fallback to standalone public/uploads if present
    const standalonePath = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', filename)

    let fileBuffer: Buffer | null = null

    try {
      fileBuffer = await fs.readFile(primaryPath)
    } catch {
      try {
        fileBuffer = await fs.readFile(standalonePath)
      } catch {
        return new NextResponse('Image not found', { status: 404 })
      }
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
    const contentType = MIME_TYPES[ext] || 'image/jpeg'

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving upload image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
