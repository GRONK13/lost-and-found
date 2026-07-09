'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notFound, useRouter } from 'next/navigation'
import Image from 'next/image'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageModal } from '@/components/ImageModal'
import { UpdateItemStatusButton } from '@/components/UpdateItemStatusButton'
import { ChatWithReporterButton } from '@/components/ChatWithReporterButton'
import { ClaimItemModal } from '@/components/ClaimItemModal'
import { MapPin, Calendar, User, Hand, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const dynamic = 'force-dynamic'

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userClaim, setUserClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setDeleting(true)

    try {
      // Delete photo from storage if exists
      if (item.photo_url) {
        const fileName = item.photo_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('item-photos').remove([fileName])
        }
      }

      // Delete item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      })

      router.push('/my-reports')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      // Get item
      const { data: itemData } = await supabase
        .from('items')
        .select(`
          *,
          users!reporter_id(id, name, email)
        `)
        .eq('id', params.id)
        .single()

      if (!itemData) {
        router.push('/404')
        return
      }

      setItem(itemData)

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Check if current user has a CLAIM-TYPE claim on this item (not chat-type)
        const { data } = await supabase
          .from('claims')
          .select(`
            *,
            items!inner(*, users!reporter_id(name, email))
          `)
          .eq('item_id', itemData.id)
          .eq('claimant_id', currentUser.id)
          .eq('chat_type', 'claim')
          .single()

        setUserClaim(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return notFound()
  }

  const isReporter = user && item.reporter_id === user.id
  const isLostItem = item.status === 'lost'

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* Image Section */}
        <div className="space-y-4">
          {item.photo_url ? (
            <div className="bg-card border border-primary/10 rounded-2xl p-2.5 shadow-md">
              <div 
                className="relative h-[400px] w-full cursor-pointer rounded-xl overflow-hidden group"
                onClick={() => setImageModalOpen(true)}
              >
                <Image 
                  src={item.photo_url} 
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold bg-primary/80 backdrop-blur-sm px-3.5 py-2 rounded-lg shadow-md">
                    Click to enlarge
                  </span>
                </div>
              </div>
              <ImageModal
                src={item.photo_url}
                alt={item.title}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />
            </div>
          ) : (
            <div className="h-[400px] bg-muted border border-border/60 rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-6">
              <p className="font-semibold text-sm">No image available for this report</p>
              <p className="text-xs text-center mt-1">Reporters are encouraged to upload images during submission</p>
            </div>
          )}
        </div>
        
        {/* Details Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-foreground">{item.title}</h1>
              {isReporter && (
                <div className="flex gap-2 shrink-0">
                  <Link href={`/items/${item.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-9 hover:bg-muted font-semibold text-xs border-primary/10">
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 hover:bg-muted font-semibold text-xs text-destructive border-destructive/10 hover:bg-destructive/5" disabled={deleting}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your report
                          and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90">
                          {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadge status={item.status as any} />
              <Badge variant="outline" className="text-xs font-semibold tracking-wide uppercase px-2.5 py-0.5 border-primary/20 text-primary">
                {item.category}
              </Badge>
              {item.campus && (
                <Badge variant="secondary" className="text-xs font-semibold tracking-wide uppercase px-2.5 py-0.5">
                  {item.campus === 'TC' ? 'Talamban Campus (TC)' : 'Downtown Campus (DC)'}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="bg-card border border-primary/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Report Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground/80 leading-none">Location</div>
                  <span className="text-foreground font-medium">{item.location || 'Location not specified'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground/80 leading-none">Date Logged</div>
                  <span className="text-foreground font-medium">{new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground sm:col-span-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground/80 leading-none">Logged By</div>
                  <span className="text-foreground font-medium">{item.users?.name || item.users?.email || 'Unknown User'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Description</h2>
            <p className="text-foreground text-sm sm:text-base leading-relaxed bg-muted/40 p-4 rounded-xl border border-border/40">
              {item.description}
            </p>
          </div>

          <div className="pt-4 border-t border-border/60">
            {/* Update Status Button - Only for reporter on lost/found items */}
            {isReporter && (
              <div className="w-full">
                <UpdateItemStatusButton
                  itemId={item.id}
                  currentStatus={item.status}
                />
              </div>
            )}

            {/* For LOST items - Chat with Reporter Button */}
            {!isReporter && user && isLostItem && (
              <div className="w-full">
                <ChatWithReporterButton
                  itemId={item.id}
                  reporterId={item.reporter_id}
                  currentUserId={user.id}
                  itemStatus={item.status}
                />
              </div>
            )}
            
            {/* For FOUND items - "This is mine" and "Chat with Reporter" buttons */}
            {user && 
             !isReporter && 
             !isLostItem &&
             item.status !== 'claimed' && 
             item.status !== 'returned' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setClaimModalOpen(true)}
                  className="flex-1 brand-button-hover bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 h-11 rounded-xl"
                  disabled={!!userClaim}
                  variant={userClaim ? "outline" : "default"}
                >
                  <Hand className="mr-2 h-4 w-4" />
                  {userClaim ? 'Claim Request Submitted' : 'This is mine'}
                </Button>
                <ChatWithReporterButton
                  itemId={item.id}
                  reporterId={item.reporter_id}
                  currentUserId={user.id}
                  itemStatus={item.status}
                  fullWidth={false}
                />
              </div>
            )}
          </div>

          {/* Claim Modal */}
          <ClaimItemModal
            itemId={item.id}
            itemTitle={item.title}
            isOpen={claimModalOpen}
            onClose={() => setClaimModalOpen(false)}
          />
        </div>
      </div>
    </div>
  )
}
