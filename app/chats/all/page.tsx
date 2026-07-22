'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface Claim {
  id: number
  status: string
  created_at: string
  role: 'claimant' | 'reporter'
  otherUserName: string
  itemTitle: string
  itemId: number
  unreadCount: number
  chatType: string
}

export default function AllChatsPage() {
  const [user, setUser] = useState<any>(null)
  const [allClaims, setAllClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }

      setUser(currentUser)

      // Get all claims where the user is either the claimant or the reporter
      // Get ALL chat-type claims (not just pending/approved)
      const { data: claimsAsClaimant } = await supabase
        .from('claims')
        .select(`
          *,
          items!inner(
            id,
            title,
            photo_url,
            users!reporter_id(name, email)
          )
        `)
        .eq('claimant_id', currentUser.id)
        .eq('chat_type', 'chat')
        .order('created_at', { ascending: false })

      const { data: claimsAsReporter } = await supabase
        .from('claims')
        .select(`
          *,
          users!claimant_id(name, email),
          items!inner(id, title, photo_url, reporter_id)
        `)
        .eq('items.reporter_id', currentUser.id)
        .eq('chat_type', 'chat')
        .order('created_at', { ascending: false })

      const claims = [
        ...(claimsAsClaimant || []).map(claim => ({
          id: claim.id,
          status: claim.status,
          created_at: claim.created_at,
          role: 'claimant' as const,
          otherUserName: claim.items?.users?.name || claim.items?.users?.email || 'Reporter',
          itemTitle: claim.items?.title || 'Unknown Item',
          itemId: claim.items?.id,
          unreadCount: 0,
          chatType: claim.chat_type,
        })),
        ...(claimsAsReporter || []).map(claim => ({
          id: claim.id,
          status: claim.status,
          created_at: claim.created_at,
          role: 'reporter' as const,
          otherUserName: claim.users?.name || claim.users?.email || 'Claimant',
          itemTitle: claim.items?.title || 'Unknown Item',
          itemId: claim.items?.id,
          unreadCount: 0,
          chatType: claim.chat_type,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Fetch unread count for each claim
      for (const claim of claims) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('claim_id', claim.id)
          .eq('read', false)
          .neq('sender_id', currentUser.id)
        
        claim.unreadCount = count || 0
      }

      setAllClaims(claims)
      setLoading(false)
    }

    fetchData()
  }, [])

  const statusColor: Record<string, 'default' | 'destructive' | 'secondary'> = {
    pending: 'default',
    approved: 'secondary',
    rejected: 'destructive',
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
      <div>
        <Link href="/chats">
          <Button variant="outline" size="sm" className="mb-6 hover:bg-muted border-primary/10 rounded-xl font-bold h-9">
            <ArrowLeft className="h-4 w-4 mr-2 text-primary" />
            Back to Active Chats
          </Button>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">All Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all your chat histories, including active and archived claims
        </p>
      </div>

      {allClaims.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold">No conversations found</p>
            <p className="text-sm text-muted-foreground mt-2">
              You haven&apos;t started any chat conversations yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {allClaims.map((claim) => (
            <Link key={claim.id} href={`/chats?claimId=${claim.id}`}>
              <Card className={cn(
                "glass-card border-primary/10 hover:shadow-lg transition-all cursor-pointer rounded-2xl overflow-hidden",
                claim.unreadCount > 0 && "bg-primary/5 border-primary/45"
              )}>
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 relative">
                        <User2 className="h-5 w-5 text-primary" />
                        {claim.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-md animate-pulse">
                            {claim.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={cn(
                          "text-sm truncate text-foreground",
                          claim.unreadCount > 0 ? "font-extrabold text-primary" : "font-bold"
                        )}>
                          {claim.otherUserName}
                        </CardTitle>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                          {claim.role === 'claimant' ? 'You contacted them' : 'They contacted you'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={statusColor[claim.status] === 'default' ? 'default' : (claim.status === 'approved' ? 'secondary' : 'destructive')}
                      className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5"
                    >
                      {claim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/20">
                      <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold truncate">{claim.itemTitle}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">
                      Started {new Date(claim.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
