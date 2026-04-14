import { createClient } from '@/lib/supabase/server'
import { moderateImageUrl } from '@/lib/image-moderation'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const reportItemSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['ID', 'Gadget', 'Book', 'Clothing', 'Other']),
  status: z.enum(['lost', 'found']),
  location: z.string().min(2).max(200),
  campus: z.enum(['TC', 'MC']),
  photo_url: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = reportItemSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 })
    }

    const moderation = await moderateImageUrl(parsed.data.photo_url)

    const { data: insertedItem, error } = await supabase
      .from('items')
      .insert({
        ...parsed.data,
        reporter_id: user.id,
        hidden: moderation.isInappropriate,
      })
      .select('id, hidden')
      .single()

    if (error) {
      console.error('Error creating moderated item:', error)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      item: insertedItem,
      moderation,
    })
  } catch (error) {
    console.error('Error in moderated report route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
