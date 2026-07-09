import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id: userIdToDelete } = await context.params

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    }

    if (user.id === userIdToDelete) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    // Initialize Supabase Admin Client using Service Role Key
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete user from auth.users (cascades to public.users and related items/claims due to ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)

    if (error) {
      console.error('Error deleting user via Admin API:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete user route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
