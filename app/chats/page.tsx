'use client'

import { createClient } from '@/lib/supabase/client'
import { ChatBox } from '@/components/ChatBox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

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
}

function ChatsContent() {
  const [user, setUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [allClaims, setAllClaims] = useState<Claim[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const claimIdFromUrl = searchParams.get('claimId')
  const supabase = createClient()

  // Function to refresh unread count for all claims
  const refreshUnreadCounts = async (userId: string) => {
    const updatedClaims = [...allClaims]
    
    for (const claim of updatedClaims) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('claim_id', claim.id)
        .eq('read', false)
        .neq('sender_id', userId)
      
      claim.unreadCount = count || 0
    }
    
    setAllClaims(updatedClaims)
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        window.location.href = '/auth/login'
        return
      }

      setUser(currentUser)

      // Get current user's profile
      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', currentUser.id)
        .single()

      setCurrentUserProfile(profile)

      // Get all claims where the user is either the claimant or the reporter
      // Only get chat-type claims (not regular claim requests)
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
        .in('status', ['pending', 'approved'])
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
        .in('status', ['pending', 'approved'])
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
          unreadCount: 0, // Will be populated below
        })),
        ...(claimsAsReporter || []).map(claim => ({
          id: claim.id,
          status: claim.status,
          created_at: claim.created_at,
          role: 'reporter' as const,
          otherUserName: claim.users?.name || claim.users?.email || 'Claimant',
          itemTitle: claim.items?.title || 'Unknown Item',
          itemId: claim.items?.id,
          unreadCount: 0, // Will be populated below
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
      
      // Auto-select claim from URL or first claim
      if (claimIdFromUrl) {
        const claimId = parseInt(claimIdFromUrl)
        if (claims.find(c => c.id === claimId)) {
          setSelectedClaimId(claimId)
        } else if (claims.length > 0) {
          setSelectedClaimId(claims[0].id)
        }
      } else if (claims.length > 0) {
        setSelectedClaimId(claims[0].id)
      }

      setLoading(false)
    }

    fetchData()
  }, [claimIdFromUrl])

  // Subscribe to message updates to refresh unread counts in real-time
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('chats-page-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh unread counts when any message is inserted or updated
          refreshUnreadCounts(user.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, allClaims])

  // Refresh unread counts when a conversation is selected
  useEffect(() => {
    if (user && selectedClaimId) {
      // Small delay to allow ChatBox to mark messages as read first
      const timer = setTimeout(() => {
        refreshUnreadCounts(user.id)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [selectedClaimId, user])

  const statusColor: Record<'pending' | 'approved' | 'rejected', 'default' | 'destructive'> = {
    pending: 'default',
    approved: 'default',
    rejected: 'destructive',
  }

  const selectedClaim = allClaims.find(c => c.id === selectedClaimId)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Coordinate meetups and verify claims with other Carolinians in real-time
        </p>
      </div>

      {allClaims.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold">No active conversations</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              When you submit a claim or when someone claims an item you reported, your chats will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          <div className="md:col-span-4 lg:col-span-3">
            <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-md">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">
                    Conversations
                  </CardTitle>
                  <Link 
                    href="/chats/all" 
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {allClaims.map((claim) => (
                    <button
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      className={cn(
                        "w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors border-l-4 relative flex items-center justify-between",
                        selectedClaimId === claim.id
                          ? "bg-muted/70 border-l-primary"
                          : "border-l-transparent",
                        claim.unreadCount > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 relative">
                          <User2 className="h-4.5 w-4.5 text-primary" />
                          {claim.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-md animate-pulse">
                              {claim.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs truncate text-foreground",
                            claim.unreadCount > 0 ? "font-bold text-primary" : "font-semibold"
                          )}>
                            {claim.otherUserName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                            {claim.itemTitle}
                          </p>
                          <p className="text-[9px] text-muted-foreground/80 mt-1 uppercase tracking-wider font-bold">
                            {claim.role === 'claimant' ? 'You → Reporter' : 'Claimant → You'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-8 lg:col-span-9">
            {selectedClaim && user ? (
              <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-md">
                <CardHeader className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-extrabold leading-snug">
                        <Link 
                          href={`/items/${selectedClaim.itemId}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {selectedClaim.itemTitle}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedClaim.role === 'claimant' 
                          ? `You are messaging the reporter ${selectedClaim.otherUserName}`
                          : `Claimant ${selectedClaim.otherUserName} is messaging you`
                        }
                      </p>
                    </div>
                    <Badge variant={statusColor[selectedClaim.status as keyof typeof statusColor] === 'default' ? 'secondary' : 'destructive'} className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5">
                      {selectedClaim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 px-6 pb-6">
                  <ChatBox
                    claimId={selectedClaim.id}
                    currentUserId={user.id}
                    currentUserName={currentUserProfile?.name || 'You'}
                    otherUserName={selectedClaim.otherUserName}
                    borderless={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-muted-foreground">Select a conversation to start chatting</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    }>
      <ChatsContent />
    </Suspense>
  )
}
