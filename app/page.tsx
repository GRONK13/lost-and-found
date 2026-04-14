import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ItemCard } from '@/components/ItemCard'
import { Search, PlusCircle, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Get recent items
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Lost & Found Portal</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Find what you've lost, return what you've found
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/items">
            <Button size="lg" className="w-full sm:w-auto">
              <Search className="mr-2 h-5 w-5" />
              Browse Items
            </Button>
          </Link>

          {user ? (
            <Link href="/report">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" />
                Report Item
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Items */}
      {items && items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Recent Items</h2>
            <Link href="/items">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
