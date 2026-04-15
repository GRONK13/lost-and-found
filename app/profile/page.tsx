'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ItemCard } from '@/components/ItemCard'
import { ClaimCard } from '@/components/ClaimCard'
import { ChangePasswordForm } from '@/components/ChangePasswordForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [reportedItems, setReportedItems] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }

      setUser(currentUser)

      // Get user metadata
      const { data: userDataRes } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setUserData(userDataRes)

      // Get user's reported items
      const { data: reportedItemsRes } = await supabase
        .from('items')
        .select('*')
        .eq('reporter_id', currentUser.id)
        .order('created_at', { ascending: false })

      setReportedItems(reportedItemsRes || [])

      // Get user's claims
      const { data: claimsRes } = await supabase
        .from('claims')
        .select(`
          *,
          items(*)
        `)
        .eq('claimant_id', currentUser.id)
        .order('created_at', { ascending: false })

      setClaims(claimsRes || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Profile
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span>{' '}
                <span className="text-muted-foreground">{userData?.name || 'Not set'}</span>
              </div>
              <div>
                <span className="font-semibold">Email:</span>{' '}
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <div>
                <span className="font-semibold">Role:</span>{' '}
                <span className="text-muted-foreground capitalize">{userData?.role || 'user'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordForm />
      </div>

      <Tabs defaultValue="reported" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reported">
            My Reported Items ({reportedItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="claims">
            My Claims ({claims?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reported" className="mt-6">
          {reportedItems && reportedItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  You haven&apos;t reported any items yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          {claims && claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={claim} 
                  showItemDetails={true}
                  canApprove={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  You haven&apos;t made any claims yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
