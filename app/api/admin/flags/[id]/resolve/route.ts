import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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
    const flagId = Number(id)

    if (!Number.isFinite(flagId)) {
      return NextResponse.json({ error: 'Invalid flag id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const hideItem = Boolean(body?.hideItem)

    const { data: flag, error: flagError } = await supabase
      .from('flags')
      .select('id, item_id')
      .eq('id', flagId)
      .single()

    if (flagError || !flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    if (hideItem) {
      const { error: hideError } = await supabase
        .from('items')
        .update({ hidden: true })
        .eq('id', flag.item_id)

      if (hideError) {
        console.error('Error hiding item during flag resolution:', hideError)
        return NextResponse.json({ error: 'Failed to hide item' }, { status: 500 })
      }
    }

    const { error: deleteError } = await supabase
      .from('flags')
      .delete()
      .eq('id', flagId)

    if (deleteError) {
      console.error('Error resolving flag:', deleteError)
      return NextResponse.json({ error: 'Failed to resolve flag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in resolve flag route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
