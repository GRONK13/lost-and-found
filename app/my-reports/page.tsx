'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ItemCard } from '@/components/ItemCard'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

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
    <div className="container mx-auto px-4 py-8">

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No reports yet</p>
            <p className="text-muted-foreground text-center">
              When you report lost or found items, they'll appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} showActions={true} userId={userId || undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
