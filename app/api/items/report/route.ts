import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { moderateImageUrl } from '@/lib/image-moderation'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const reportItemSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['ID', 'Gadget', 'Book', 'Clothing', 'Other']),
  status: z.enum(['lost', 'found', 'LOST', 'FOUND']),
  location: z.string().min(2).max(200),
  campus: z.enum(['TC', 'MC', 'DC']),
  photo_url: z.string().url().or(z.string().startsWith('/uploads/')),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = reportItemSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 })
    }

    let isHidden = false
    try {
      const moderation = await moderateImageUrl(parsed.data.photo_url)
      isHidden = moderation.isInappropriate
    } catch (e) {
      console.error('Moderation error:', e)
    }

    const item = await db.item.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category as any,
        status: parsed.data.status.toUpperCase() as any,
        location: parsed.data.location,
        campus: parsed.data.campus as any,
        photoUrl: parsed.data.photo_url,
        reporterId: user.id,
        hidden: isHidden,
      },
    })

    return NextResponse.json({
      success: true,
      item,
    })
  } catch (error) {
    console.error('Error in moderated report route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
