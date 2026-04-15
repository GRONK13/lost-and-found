'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ItemCard } from '@/components/ItemCard'
import { FiltersBar } from '@/components/FiltersBar'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    query?: string
    category?: string
    status?: string
    location?: string
    campus?: string
  }>({})

  const supabase = createClient()

  useEffect(() => {
    fetchItems()
  }, [filters])

  async function fetchItems() {
    setLoading(true)
    
    let query = supabase
      .from('items')
      .select('*')
      .eq('hidden', false)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.campus) {
      query = query.eq('campus', filters.campus)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setItems(data)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <FiltersBar filters={filters} onSearch={setFilters} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No items found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
