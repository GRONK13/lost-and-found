import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ItemCard } from '@/components/ItemCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Flag, Eye, EyeOff } from 'lucide-react'

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
  const hiddenItems = allItems?.filter(item => item.hidden)?.length || 0
  const totalFlags = flaggedItems?.length || 0
  const lostItems = allItems?.filter(item => item.status === 'lost')?.length || 0
  const foundItems = allItems?.filter(item => item.status === 'found')?.length || 0
  const claimedItems = allItems?.filter(item => item.status === 'claimed')?.length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Admin Panel</h1>
      </div>

      {/* Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{totalItems}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Flagged Items</CardDescription>
            <CardTitle className="text-3xl text-destructive">{totalFlags}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hidden Items</CardDescription>
            <CardTitle className="text-3xl">{hiddenItems}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status Breakdown</CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Lost: {lostItems}</Badge>
              <Badge variant="outline">Found: {foundItems}</Badge>
              <Badge variant="outline">Claimed: {claimedItems}</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged Items
            {totalFlags > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalFlags}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hidden">Hidden Items</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {allItems && allItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allItems.map((item) => (
                <div key={item.id} className="relative">
                  {item.hidden && (
                    <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  No items found
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flagged" className="mt-6">
          {flaggedItems && flaggedItems.length > 0 ? (
            <div className="space-y-4">
              {flaggedItems.map((flag: any) => (
                <Card key={flag.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-destructive" />
                          {flag.items?.title || 'Unknown Item'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Flagged by {flag.users?.name || 'Anonymous'} on{' '}
                          {new Date(flag.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Flagged</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="font-semibold mb-1">Reason:</p>
                      <p className="text-muted-foreground">{flag.reason}</p>
                    </div>
                    {flag.items && (
                      <div className="pt-4 border-t">
                        <ItemCard item={flag.items} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  No flagged items
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="mt-6">
          {allItems && allItems.filter(item => item.hidden).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allItems.filter(item => item.hidden).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  No hidden items
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
