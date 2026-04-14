import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ItemCard } from '@/components/ItemCard'
import { AdminItemActions } from '@/components/admin/AdminItemActions'
import { ArrowLeft, EyeOff, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHiddenPostsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  const { data: hiddenItems } = await supabase
    .from('items')
    .select('*')
    .eq('hidden', true)
    .order('created_at', { ascending: false })

  const totalHidden = hiddenItems?.length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-7 w-7" />
          <h1 className="text-3xl font-bold">Hidden Posts Review</h1>
        </div>

        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            Review hidden posts and unhide false positives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">Hidden Posts: {totalHidden}</Badge>
            <span className="text-muted-foreground">
              Items can be hidden by AI moderation or manual admin actions.
            </span>
          </div>
        </CardContent>
      </Card>

      {hiddenItems && hiddenItems.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {hiddenItems.map((item) => (
            <div key={item.id} className="relative isolate flex flex-col gap-2 h-full">
              <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                <EyeOff className="h-3 w-3 mr-1" />
                Hidden
              </Badge>
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
            <p className="text-center text-muted-foreground py-12">
              No hidden posts to review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
