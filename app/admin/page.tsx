import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'ADMIN') redirect('/')

  // Get all items
  const rawAllItems = await db.item.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { name: true, email: true } },
    },
  })

  // Format all items for client components expecting snake_case attributes
  const allItems = rawAllItems.map((item) => ({
    ...item,
    created_at: item.createdAt.toISOString(),
    photo_url: item.photoUrl,
    reporter_id: item.reporterId,
    users: item.reporter,
    status: item.status.toLowerCase(),
  }))

  // Get flagged items
  const rawFlaggedItems = await db.flag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      item: {
        include: {
          reporter: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  })

  const flaggedItems = rawFlaggedItems.map((flag) => ({
    ...flag,
    created_at: flag.createdAt.toISOString(),
    items: {
      ...flag.item,
      created_at: flag.item.createdAt.toISOString(),
      photo_url: flag.item.photoUrl,
      reporter_id: flag.item.reporterId,
      status: flag.item.status.toLowerCase(),
    },
    users: flag.user,
  }))

  // Get users
  const rawUsersList = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const usersList = rawUsersList.map((u) => ({
    ...u,
    role: u.role.toLowerCase(),
    created_at: u.createdAt.toISOString(),
  }))

  const totalItems = allItems.length
  const hiddenItems = allItems.filter((item) => item.hidden).length
  const totalFlags = flaggedItems.length
  const lostItems = allItems.filter((item) => item.status === 'lost').length
  const foundItems = allItems.filter((item) => item.status === 'found').length
  const claimedItems = allItems.filter((item) => item.status === 'claimed').length

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const totalUsers = usersList.length
  const newUsersLastWeek = rawUsersList.filter((u) => u.createdAt >= sevenDaysAgo).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Admin Panel</h1>
        </div>

        <Link href="/admin/hidden">
          <Button variant="outline">Show Hidden Posts</Button>
        </Link>
      </div>

      <AdminDashboardClient
        allItems={allItems as any}
        flaggedItems={flaggedItems as any}
        allUsers={usersList as any}
        stats={{
          totalItems,
          totalFlags,
          hiddenItems,
          lostItems,
          foundItems,
          claimedItems,
          totalUsers,
          newUsersLastWeek,
        }}
      />
    </div>
  )
}
