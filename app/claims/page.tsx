import { redirect } from 'next/navigation'
import { ClaimCard } from '@/components/ClaimCard'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ClaimsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  // Get all claims for items the user reported (only CLAIM chatType)
  const receivedClaims = await db.claim.findMany({
    where: {
      item: { reporterId: user.id },
      chatType: 'CLAIM',
    },
    include: {
      item: true,
      claimant: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get all claims the user has made (only CLAIM chatType)
  const madeClaims = await db.claim.findMany({
    where: {
      claimantId: user.id,
      chatType: 'CLAIM',
    },
    include: {
      item: {
        include: {
          reporter: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

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
            Claims on My Items ({receivedClaims.length})
          </TabsTrigger>
          <TabsTrigger value="made" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Claims I Made ({madeClaims.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {receivedClaims.length > 0 ? (
            <div className="space-y-4">
              {receivedClaims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={{
                    ...claim,
                    items: {
                      ...claim.item,
                      photo_url: claim.item.photoUrl,
                    },
                    users: claim.claimant,
                  }} 
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
          {madeClaims.length > 0 ? (
            <div className="space-y-4">
              {madeClaims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={{
                    ...claim,
                    items: {
                      ...claim.item,
                      photo_url: claim.item.photoUrl,
                    },
                    users: claim.item.reporter,
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
