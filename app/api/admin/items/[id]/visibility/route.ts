import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const itemId = Number(id)

    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ error: 'Invalid item id' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body.hidden !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid hidden value' }, { status: 400 })
    }

    const { data: updatedItem, error } = await supabase
      .from('items')
      .update({ hidden: body.hidden })
      .eq('id', itemId)
      .select('id, hidden')
      .single()

    if (error) {
      console.error('Error updating item visibility:', error)
      return NextResponse.json({ error: 'Failed to update item visibility' }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error) {
    console.error('Error in visibility route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
