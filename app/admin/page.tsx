import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminDashboardClient } from '../../components/admin/AdminDashboardClient'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  // Get all items (including hidden)
  const { data: allItems } = await supabase
    .from('items')
    .select(`
      *,
      users!reporter_id(name, email)
    `)
    .order('created_at', { ascending: false })

  // Get flagged items
  const { data: flaggedItems } = await supabase
    .from('flags')
    .select(`
      *,
      items(*),
      users!user_id(name, email)
    `)
    .order('created_at', { ascending: false })

  // Get statistics
  const totalItems = allItems?.length || 0
  const hiddenItems = allItems?.filter((item) => item.hidden)?.length || 0
  const totalFlags = flaggedItems?.length || 0
  const lostItems = allItems?.filter((item) => item.status === 'lost')?.length || 0
  const foundItems = allItems?.filter((item) => item.status === 'found')?.length || 0
  const claimedItems = allItems?.filter((item) => item.status === 'claimed')?.length || 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: totalUsers }, { count: newUsersLastWeek }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Admin Panel</h1>
        </div>

        <Link href="/admin/hidden">
          <Button variant="outline">Show Hidden Posts</Button>
        </Link>
      </div>

      <AdminDashboardClient
        allItems={allItems || []}
        flaggedItems={flaggedItems || []}
        stats={{
          totalItems,
          totalFlags,
          hiddenItems,
          lostItems,
          foundItems,
          claimedItems,
          totalUsers: totalUsers || 0,
          newUsersLastWeek: newUsersLastWeek || 0,
        }}
      />
    </div>
  )
}
