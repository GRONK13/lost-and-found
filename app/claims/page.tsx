import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClaimCard } from '@/components/ClaimCard'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export default async function ClaimsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get all claims for items the user reported (only claim-type, not chat-type)
  const { data: receivedClaims } = await supabase
    .from('claims')
    .select(`
      *,
      items!inner(id, title, description, status, category, photo_url, reporter_id),
      users!claimant_id(name, email)
    `)
    .eq('items.reporter_id', user.id)
    .eq('chat_type', 'claim')
    .order('created_at', { ascending: false })

  // Get all claims the user has made (only claim-type, not chat-type)
  const { data: madeClaims } = await supabase
    .from('claims')
    .select(`
      *,
      items!inner(id, title, description, status, category, photo_url, reporter_id)
    `)
    .eq('claimant_id', user.id)
    .eq('chat_type', 'claim')
    .order('created_at', { ascending: false })

  // For made claims, get the reporter info
  const madeClaimsWithReporter = madeClaims ? await Promise.all(
    madeClaims.map(async (claim) => {
      const { data: reporterData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', claim.items.reporter_id)
        .single()

      return {
        ...claim,
        reporter: reporterData
      }
    })
  ) : []

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-6">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Claims Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve or reject ownership claims on items you reported, and track claims you submitted
        </p>
      </div>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1.5 rounded-xl border border-primary/5">
          <TabsTrigger value="received" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Claims on My Items ({receivedClaims?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="made" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Claims I Made ({madeClaimsWithReporter?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {receivedClaims && receivedClaims.length > 0 ? (
            <div className="space-y-4">
              {receivedClaims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={claim} 
                  showItemDetails={true}
                  canApprove={true}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-16">
                  No claims have been submitted for your reported items yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="made" className="mt-6">
          {madeClaimsWithReporter && madeClaimsWithReporter.length > 0 ? (
            <div className="space-y-4">
              {madeClaimsWithReporter.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={{
                    ...claim,
                    users: claim.reporter
                  }}
                  showItemDetails={true}
                  canApprove={false}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-16">
                  You haven&apos;t submitted any claims for found items yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
