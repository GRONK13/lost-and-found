'use client'

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
  const [allClaims, setAllClaims] = useState<Claim[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const claimIdFromUrl = searchParams.get('claimId')

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats')
      if (res.status === 401) {
        window.location.href = '/auth/login'
        return
      }

      const data = await res.json()
      if (res.ok && data.conversations) {
        setUser(data.user)
        setAllClaims(data.conversations)

        if (!selectedClaimId) {
          if (claimIdFromUrl) {
            const claimId = parseInt(claimIdFromUrl)
            if (data.conversations.find((c: Claim) => c.id === claimId)) {
              setSelectedClaimId(claimId)
            } else if (data.conversations.length > 0) {
              setSelectedClaimId(data.conversations[0].id)
            }
          } else if (data.conversations.length > 0) {
            setSelectedClaimId(data.conversations[0].id)
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChats()
    const interval = setInterval(() => {
      fetchChats()
    }, 3000)
    return () => clearInterval(interval)
  }, [claimIdFromUrl])

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
                    currentUserName={user.name || 'You'}
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
