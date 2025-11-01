import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ItemCard } from '@/components/ItemCard'
import { Search, PlusCircle, Shield } from 'lucide-react'

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

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Browse Items</h3>
          <p className="text-muted-foreground">
            Search through lost and found items with powerful filters
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Report Items</h3>
          <p className="text-muted-foreground">
            Easily report lost or found items with photos and details
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Secure Claims</h3>
          <p className="text-muted-foreground">
            Claim items securely - reporters approve legitimate claims
          </p>
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

      {/* CTA Section */}
      {!user && (
        <div className="mt-16 bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join our community to report items and help reunite lost belongings with their owners
          </p>
          <Link href="/auth/register">
            <Button size="lg">Sign Up Now</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
