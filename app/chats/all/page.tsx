'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/chats">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chats
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">All Conversations</h1>
        <p className="text-muted-foreground mt-2">
          View all your chat conversations, including archived ones
        </p>
      </div>

      {allClaims.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No conversations</p>
            <p className="text-muted-foreground text-center">
              You haven't started any conversations yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClaims.map((claim) => (
            <Link key={claim.id} href={`/chats?claimId=${claim.id}`}>
              <Card className={cn(
                "hover:shadow-lg transition-all cursor-pointer",
                claim.unreadCount > 0 && "border-primary/50 bg-primary/5"
              )}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                        <User2 className="h-6 w-6 text-primary" />
                        {claim.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                            {claim.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={cn(
                          "text-base truncate",
                          claim.unreadCount > 0 ? "font-bold" : "font-semibold"
                        )}>
                          {claim.otherUserName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {claim.role === 'claimant' ? 'You contacted them' : 'They contacted you'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={statusColor[claim.status] || 'default'}
                      className="text-xs flex-shrink-0"
                    >
                      {claim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{claim.itemTitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
