import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify that the user owns the item associated with this claim
    const { data: claim } = await supabase
      .from('claims')
      .select('*, items!inner(reporter_id)')
      .eq('id', id)
      .single()

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.items.reporter_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the claim
    const { error } = await supabase
      .from('claims')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating claim:', error)
      return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
    }

    // If approved AND it's a claim-type (not chat-type), update the item status to returned
    if (status === 'approved' && claim.chat_type === 'claim') {
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'returned' })
        .eq('id', claim.item_id)

      if (itemError) {
        console.error('Error updating item:', itemError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update claim route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
