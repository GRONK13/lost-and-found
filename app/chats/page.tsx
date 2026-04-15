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
    <div className="container mx-auto px-4 py-8">
      {allClaims.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No active chats</p>
            <p className="text-muted-foreground text-center">
              When you claim an item or receive a claim, you'll be able to chat here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversations
                  </CardTitle>
                  <Link 
                    href="/chats/all" 
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {allClaims.map((claim) => (
                    <button
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-l-2 relative",
                        selectedClaimId === claim.id
                          ? "bg-muted border-l-primary"
                          : "border-l-transparent",
                        claim.unreadCount > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                          <User2 className="h-5 w-5 text-primary" />
                          {claim.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                              {claim.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={cn(
                              "text-sm truncate",
                              claim.unreadCount > 0 ? "font-bold" : "font-medium"
                            )}>
                              {claim.otherUserName}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {claim.itemTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {claim.role === 'claimant' ? `You → ${claim.otherUserName}` : `${claim.otherUserName} → You`}
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
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">
                        <Link 
                          href={`/items/${selectedClaim.itemId}`}
                          className="hover:underline"
                        >
                          {selectedClaim.itemTitle}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedClaim.role === 'claimant' 
                          ? `You ↔ ${selectedClaim.otherUserName}`
                          : `${selectedClaim.otherUserName} ↔ You`
                        }
                      </p>
                    </div>
                    <Badge variant={statusColor[selectedClaim.status as keyof typeof statusColor]}>
                      {selectedClaim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChatBox
                    claimId={selectedClaim.id}
                    currentUserId={user.id}
                    currentUserName={currentUserProfile?.name || 'You'}
                    otherUserName={selectedClaim.otherUserName}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
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
