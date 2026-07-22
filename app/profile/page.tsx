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
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">User Account Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your profile status, update security settings, and audit your submissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-primary/10 shadow-md">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <User className="h-5 w-5 text-primary" />
              Personal Info
            </CardTitle>
            <CardDescription className="text-xs">
              Your registered portal credentials and system role
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="font-semibold text-muted-foreground">Full Name:</span>
              <span className="font-bold text-foreground">{userData?.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="font-semibold text-muted-foreground">Email Address:</span>
              <span className="font-semibold text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-muted-foreground">Portal Role:</span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wide">
                {userData?.role || 'user'}
              </span>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordForm />
      </div>

      <Tabs defaultValue="reported" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1.5 rounded-xl border border-primary/5">
          <TabsTrigger value="reported" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            My Reported Items ({reportedItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="claims" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
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
            <Card className="glass-card">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-16">
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
            <Card className="glass-card">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-16">
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
