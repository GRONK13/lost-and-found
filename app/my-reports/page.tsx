'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ItemCard } from '@/components/ItemCard'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function MyReportsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyReports = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setItems(data)
      }

      setLoading(false)
    }

    fetchMyReports()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading your reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Reported Items</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all lost and found reports you have submitted to the platform
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="glass-card border-dashed p-10">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
              <FileQuestion className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold">No reports submitted yet</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              If you found something or lost a personal item on campus, report it and it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} showActions={true} userId={userId || undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
