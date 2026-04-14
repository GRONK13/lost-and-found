'use client'

import { useMemo, useState } from 'react'
import { ItemCard } from '@/components/ItemCard'
import { AdminItemActions } from '@/components/admin/AdminItemActions'
import { FlagReviewActions } from '@/components/admin/FlagReviewActions'
import { Database } from '@/lib/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EyeOff, Flag } from 'lucide-react'

type Item = Database['public']['Tables']['items']['Row']

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
  stats: AdminStats
}

export function AdminDashboardClient({ allItems, flaggedItems, stats }: AdminDashboardClientProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Item['status']>('all')
  const [campusFilter, setCampusFilter] = useState<'all' | 'TC' | 'MC'>('all')

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

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Filters</CardTitle>
          <CardDescription>Filter admin results by keyword, status, or campus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, reason, user, location..."
            />

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | Item['status'])}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Filter by campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campuses</SelectItem>
                <SelectItem value="TC">Talamban (TC)</SelectItem>
                <SelectItem value="MC">Main (MC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">Lost: {stats.lostItems}</Badge>
            <Badge variant="outline">Found: {stats.foundItems}</Badge>
            <Badge variant="outline">Claimed: {stats.claimedItems}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged Items
            {stats.totalFlags > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.totalFlags}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hidden">Hidden Items</TabsTrigger>
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
      </Tabs>
    </>
  )
}
