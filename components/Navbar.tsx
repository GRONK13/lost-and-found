'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Menu, Search, PlusCircle, User, LogOut, Shield, MessageCircle, FileText } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role)
        }

        // Get pending claims count
        await fetchPendingClaimsCount(user.id)
        
        // Get unread messages count
        await fetchUnreadMessagesCount(user.id)
        
        // Subscribe to new messages
        const messagesChannel = supabase
          .channel('navbar-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            () => {
              // Refresh unread count when new message arrives
              fetchUnreadMessagesCount(user.id)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
            },
            () => {
              // Refresh unread count when message is marked as read
              fetchUnreadMessagesCount(user.id)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(messagesChannel)
        }
      }
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPendingClaimsCount(session.user.id)
        fetchUnreadMessagesCount(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchPendingClaimsCount = async (userId: string) => {
    // Only count claim-type claims, not chat-type
    const { data } = await supabase
      .from('claims')
      .select('id, items!inner(reporter_id)')
      .eq('items.reporter_id', userId)
      .eq('status', 'pending')
      .eq('chat_type', 'claim')

    setPendingClaimsCount(data?.length || 0)
  }

  const fetchUnreadMessagesCount = async (userId: string) => {
    // Get all chat-type claims where user is involved (as claimant or reporter)
    const { data: userClaims } = await supabase
      .from('claims')
      .select('id, item_id, items!inner(reporter_id)')
      .or(`claimant_id.eq.${userId},items.reporter_id.eq.${userId}`)
      .eq('chat_type', 'chat')
      .in('status', ['pending', 'approved'])

    if (!userClaims || userClaims.length === 0) {
      setUnreadMessagesCount(0)
      return
    }

    const claimIds = userClaims.map(c => c.id)

    // Count unread messages in these claims (not sent by current user)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('claim_id', claimIds)
      .eq('read', false)
      .neq('sender_id', userId)

    setUnreadMessagesCount(count || 0)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Lost & Found
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/items"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === '/items' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Search className="inline-block w-4 h-4 mr-1" />
                Browse Items
              </Link>
              
              {user && (
                <>
                  <Link
                    href="/report"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === '/report' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <PlusCircle className="inline-block w-4 h-4 mr-1" />
                    Report Item
                  </Link>
                  
                  <Link
                    href="/my-reports"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === '/my-reports' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <FileText className="inline-block w-4 h-4 mr-1" />
                    My Reports
                  </Link>
                  
                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === '/chats' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <MessageCircle className="inline-block w-4 h-4 mr-1" />
                    <div className="relative inline-block">
                      Chats
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <Link
                    href="/claims"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === '/claims' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="relative inline-block">
                      My Claims
                      {pendingClaimsCount > 0 && (
                        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingClaimsCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/items">Browse Items</Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/report">Report Item</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-reports">My Reports</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/chats">Chats</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/claims">My Claims</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
