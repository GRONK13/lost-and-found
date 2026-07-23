'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Menu, Search, PlusCircle, User, LogOut, Shield, MessageCircle, FileText, EyeOff, GraduationCap } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { ColorThemeToggle } from './color-theme-toggle'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (e) {
      setUser(null)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [pathname])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md shadow-sm border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-secondary shadow-md shadow-primary/20">
                <GraduationCap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tight flex flex-col leading-none">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">USC DCISM</span>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Carolinian <span className="text-foreground">L&F</span>
                </span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/items"
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-muted ${
                  pathname === '/items' ? 'text-primary bg-muted/60' : 'text-muted-foreground'
                }`}
              >
                <Search className="w-4 h-4" />
                Browse Items
              </Link>
              
              {user && (
                <>
                  <Link
                    href="/report"
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-muted ${
                      pathname === '/report' ? 'text-primary bg-muted/60' : 'text-muted-foreground'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Report Item
                  </Link>
                  
                  <Link
                    href="/my-reports"
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-muted ${
                      pathname === '/my-reports' ? 'text-primary bg-muted/60' : 'text-muted-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    My Reports
                  </Link>
                  
                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-muted relative ${
                      pathname === '/chats' ? 'text-primary bg-muted/60' : 'text-muted-foreground'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chats
                  </Link>
                  
                  <Link
                    href="/claims"
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-muted relative ${
                      pathname === '/claims' ? 'text-primary bg-muted/60' : 'text-muted-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    My Claims
                  </Link>
                </>
              )}
            </div>
          </div>
 
          <div className="flex items-center gap-2">
            <ColorThemeToggle />
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/10 hover:border-primary/20">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4 text-primary" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4 text-secondary" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/hidden" className="cursor-pointer">
                          <EyeOff className="mr-2 h-4 w-4 text-muted-foreground" />
                          Hidden Posts Review
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="hover:bg-muted text-muted-foreground hover:text-foreground">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="brand-button-hover bg-primary text-primary-foreground">Sign Up</Button>
                </Link>
              </div>
            )}
 
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card">
                <DropdownMenuItem asChild>
                  <Link href="/items" className="cursor-pointer">Browse Items</Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/report" className="cursor-pointer">Report Item</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-reports" className="cursor-pointer">My Reports</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/chats" className="cursor-pointer">Chats</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/claims" className="cursor-pointer">My Claims</Link>
                    </DropdownMenuItem>
                    {user.role === 'ADMIN' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/hidden" className="cursor-pointer">Hidden Posts Review</Link>
                      </DropdownMenuItem>
                    )}
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
