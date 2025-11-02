import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClaimCard } from '@/components/ClaimCard'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    <div className="container mx-auto px-4 py-8">
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            Claims on My Items ({receivedClaims?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="made">
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
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  No one has claimed your items yet
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
