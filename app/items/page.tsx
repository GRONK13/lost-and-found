'use client'

import { useState, useEffect } from 'react'
import { ItemCard } from '@/components/ItemCard'
import { FiltersBar } from '@/components/FiltersBar'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ItemsPage() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    query?: string
    category?: string
    status?: string
    location?: string
    campus?: string
  }>({
    category: searchParams.get('category') || undefined
  })

  useEffect(() => {
    const cat = searchParams.get('category') || undefined
    setFilters(prev => ({ ...prev, category: cat }))
  }, [searchParams])

  useEffect(() => {
    fetchItems()
  }, [filters])

  async function fetchItems() {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.campus) params.append('campus', filters.campus)
      if (filters.location) params.append('location', filters.location)
      if (filters.query) params.append('query', filters.query)

      const res = await fetch(`/api/items?${params.toString()}`)
      const data = await res.json()

      if (res.ok && data.items) {
        setItems(data.items)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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
