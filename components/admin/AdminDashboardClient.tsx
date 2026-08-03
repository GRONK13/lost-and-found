'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCard } from '@/components/ItemCard'
import { AdminItemActions } from '@/components/admin/AdminItemActions'
import { FlagReviewActions } from '@/components/admin/FlagReviewActions'
import { Database } from '@/lib/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EyeOff, Flag, Trash2, ShieldAlert, User2, AlertTriangle, Database as DatabaseIcon, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type Item = Database['public']['Tables']['items']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

type Flag = Database['public']['Tables']['flags']['Row'] & {
  items: Item | null
  users: {
    name: string | null
    email: string
  } | null
}

interface AdminStats {
  totalItems: number
  totalFlags: number
  hiddenItems: number
  lostItems: number
  foundItems: number
  claimedItems: number
  totalUsers: number
  newUsersLastWeek: number
}

interface AdminDashboardClientProps {
  allItems: Item[]
  flaggedItems: Flag[]
  allUsers: UserProfile[]
  stats: AdminStats
}

export function AdminDashboardClient({ allItems, flaggedItems, allUsers, stats }: AdminDashboardClientProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Item['status']>('all')
  const [campusFilter, setCampusFilter] = useState<'all' | 'TC' | 'MC'>('all')
  const [userEmailTypeFilter, setUserEmailTypeFilter] = useState<'all' | 'non-usc'>('all')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const router = useRouter()

  const handleRunMigration = async () => {
    if (!window.confirm('Import pre-existing records from Supabase into MariaDB? An automatic pre-migration snapshot will be saved first.')) {
      return
    }

    setIsMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Migration failed')
      }

      toast({
        title: 'Migration Successful 🎉',
        description: `Migrated ${data.migrated.users} users, ${data.migrated.items} items, ${data.migrated.claims} claims, and ${data.migrated.messages} messages into MariaDB!`,
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Migration Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const handleRunRollback = async () => {
    if (!window.confirm('⚠️ WARNING: Revert MariaDB to the pre-migration snapshot? This will reset MariaDB data to the state prior to migration.')) {
      return
    }

    setIsRollingBack(true)
    try {
      const res = await fetch('/api/admin/rollback', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Rollback failed')
      }

      toast({
        title: 'Rollback Completed 🔄',
        description: 'MariaDB database has been safely restored to pre-migration snapshot.',
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Rollback Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user ${userEmail}? This will permanently delete their account and all their reported items, claims, and messages.`)) {
      return
    }

    setIsDeleting(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      toast({
        title: 'Success',
        description: `Successfully deleted account for ${userEmail}`,
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()

  const filteredAllItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        (item.location || '').toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesCampus = campusFilter === 'all' || item.campus === campusFilter

      return matchesQuery && matchesStatus && matchesCampus
    })
  }, [allItems, normalizedQuery, statusFilter, campusFilter])

  const filteredHiddenItems = useMemo(() => {
    return filteredAllItems.filter((item) => item.hidden)
  }, [filteredAllItems])

  const filteredFlaggedItems = useMemo(() => {
    return flaggedItems.filter((flag) => {
      const item = flag.items

      if (!normalizedQuery) {
        return true
      }

      return (
        (item?.title || '').toLowerCase().includes(normalizedQuery) ||
        (item?.description || '').toLowerCase().includes(normalizedQuery) ||
        (flag.reason || '').toLowerCase().includes(normalizedQuery) ||
        (flag.users?.name || '').toLowerCase().includes(normalizedQuery) ||
        (flag.users?.email || '').toLowerCase().includes(normalizedQuery)
      )
    })
  }, [flaggedItems, normalizedQuery])

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        (user.name || '').toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)

      const isNonUsc = !user.email.toLowerCase().endsWith('@usc.edu.ph')
      const matchesEmailType = userEmailTypeFilter === 'all' || (userEmailTypeFilter === 'non-usc' && isNonUsc)

      return matchesQuery && matchesEmailType
    })
  }, [allUsers, normalizedQuery, userEmailTypeFilter])

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{stats.totalItems}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Flagged Items</CardDescription>
            <CardTitle className="text-3xl text-destructive">{stats.totalFlags}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hidden Items</CardDescription>
            <CardTitle className="text-3xl">{stats.hiddenItems}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newUsersLastWeek} in the last 7 days
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card className="mb-8 glass-card border-primary/10 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            Database Migration & Revert Tools
          </CardTitle>
          <CardDescription>
            Import pre-existing records from Supabase into MariaDB, or revert to a pre-migration snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={handleRunMigration}
            disabled={isMigrating || isRollingBack}
            className="brand-button-hover bg-primary text-primary-foreground font-bold shadow-sm rounded-xl h-10 px-5"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isMigrating && "animate-spin")} />
            {isMigrating ? 'Migrating Supabase Records...' : 'Import Data from Supabase'}
          </Button>

          <Button
            onClick={handleRunRollback}
            disabled={isMigrating || isRollingBack}
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 font-bold rounded-xl h-10 px-5"
          >
            <RotateCcw className={cn("h-4 w-4 mr-2", isRollingBack && "animate-spin")} />
            {isRollingBack ? 'Reverting Database...' : 'Revert / Rollback Database'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Filters</CardTitle>
          <CardDescription>Filter admin results by keyword, status, or campus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, user, email, location..."
              className="bg-background/50 border-primary/10 h-10"
            />

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | Item['status'])}>
              <SelectTrigger className="bg-background/50 border-primary/10 h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={campusFilter} onValueChange={(value) => setCampusFilter(value as 'all' | 'TC' | 'MC')}>
              <SelectTrigger className="bg-background/50 border-primary/10 h-10">
                <SelectValue placeholder="Filter by campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campuses</SelectItem>
                <SelectItem value="TC">Talamban (TC)</SelectItem>
                <SelectItem value="MC">Main (MC)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userEmailTypeFilter} onValueChange={(value) => setUserEmailTypeFilter(value as 'all' | 'non-usc')}>
              <SelectTrigger className="bg-background/50 border-primary/10 h-10">
                <SelectValue placeholder="Filter by email domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Accounts</SelectItem>
                <SelectItem value="non-usc">Non-USC Emails Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary">Lost: {stats.lostItems}</Badge>
            <Badge variant="outline" className="border-primary/20 text-primary">Found: {stats.foundItems}</Badge>
            <Badge variant="outline" className="border-primary/20 text-primary">Claimed: {stats.claimedItems}</Badge>
            <Badge variant="outline" className="border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5">
              Non-USC Accounts: {allUsers.filter((u) => !u.email.toLowerCase().endsWith('@usc.edu.ph')).length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1 rounded-xl border border-primary/5">
          <TabsTrigger value="all" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            All Items
          </TabsTrigger>
          <TabsTrigger value="flagged" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Flagged Items
            {stats.totalFlags > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] font-extrabold h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full">
                {stats.totalFlags}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hidden" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Hidden Items
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Users Management
            {allUsers.filter((u) => !u.email.toLowerCase().endsWith('@usc.edu.ph')).length > 0 && (
              <Badge className="ml-2 text-[10px] font-extrabold h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full bg-amber-600 text-white animate-pulse border-none">
                {allUsers.filter((u) => !u.email.toLowerCase().endsWith('@usc.edu.ph')).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredAllItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filteredAllItems.map((item) => (
                <div key={item.id} className="relative isolate flex flex-col gap-2 h-full">
                  {item.hidden && (
                    <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                  <div className="relative z-0 h-full">
                    <ItemCard item={item} />
                  </div>
                  <div className="relative z-20">
                    <AdminItemActions itemId={item.id} hidden={item.hidden} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">No items match the current filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flagged" className="mt-6">
          {filteredFlaggedItems.length > 0 ? (
            <div className="space-y-4">
              {filteredFlaggedItems.map((flag) => (
                <Card key={flag.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-destructive" />
                          {flag.items?.title || 'Unknown Item'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Flagged by {flag.users?.name || flag.users?.email || 'Anonymous'} on{' '}
                          {new Date(flag.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Flagged</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="font-semibold mb-1">Reason:</p>
                      <p className="text-muted-foreground">{flag.reason || 'No reason provided'}</p>
                    </div>

                    <div className="mb-4">
                      <FlagReviewActions
                        flagId={flag.id}
                        itemHidden={Boolean(flag.items?.hidden)}
                      />
                    </div>

                    {flag.items && (
                      <div className="pt-4 border-t">
                        <div className="relative isolate flex flex-col gap-2">
                          <div className="relative z-0">
                            <ItemCard item={flag.items} />
                          </div>
                          <div className="relative z-20">
                            <AdminItemActions itemId={flag.items.id} hidden={flag.items.hidden} />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">No flagged items match the current filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="mt-6">
          {filteredHiddenItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filteredHiddenItems.map((item) => (
                <div key={item.id} className="relative isolate flex flex-col gap-2 h-full">
                  <div className="relative z-0 h-full">
                    <ItemCard item={item} />
                  </div>
                  <div className="relative z-20">
                    <AdminItemActions itemId={item.id} hidden={item.hidden} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">No hidden items match the current filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          {filteredUsers.length > 0 ? (
            <div className="grid gap-4">
              {filteredUsers.map((user) => {
                const isNonUsc = !user.email.toLowerCase().endsWith('@usc.edu.ph')
                return (
                  <Card key={user.id} className={cn("glass-card border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all", isNonUsc && "border-amber-500/20 bg-amber-500/5")}>
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 border", isNonUsc ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/10 border-primary/10 text-primary")}>
                          <User2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-bold text-sm text-foreground">{user.name || 'No Name Set'}</p>
                            {user.role === 'admin' && (
                              <Badge className="bg-primary/20 text-primary border-none font-bold text-[9px] uppercase px-1.5 py-0.5">
                                Admin
                              </Badge>
                            )}
                            {isNonUsc && (
                              <Badge className="bg-amber-600 text-white border-none font-bold text-[9px] uppercase px-1.5 py-0.5 animate-pulse flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Non-USC Email
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 break-all">{user.email}</p>
                          <p className="text-[10px] text-muted-foreground/80 mt-1">
                            Joined {new Date(user.created_at || '').toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-9 px-4 font-bold rounded-lg flex items-center gap-1.5"
                          disabled={isDeleting === user.id || user.role === 'admin'}
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          {isDeleting === user.id ? (
                            'Deleting...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete User
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <User2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No users match your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
