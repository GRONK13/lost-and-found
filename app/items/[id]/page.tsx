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
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          {item.photo_url ? (
            <>
              <div 
                className="relative h-96 w-full cursor-pointer rounded-lg overflow-hidden"
                onClick={() => setImageModalOpen(true)}
              >
                <Image 
                  src={item.photo_url} 
                  alt={item.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Click image to enlarge
              </p>
              <ImageModal
                src={item.photo_url}
                alt={item.title}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />
            </>
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>
        
        {/* Details Section */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            {isReporter && (
              <div className="flex gap-2">
                <Link href={`/items/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={deleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your report
                        and remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mb-6">
            <StatusBadge status={item.status} />
            <Badge variant="outline">{item.category}</Badge>
            {item.campus && (
              <Badge variant="secondary">
                {item.campus === 'TC' ? 'Talamban Campus' : 'Main Campus'}
              </Badge>
            )}
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{item.location || 'Location not specified'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Reported by {item.users?.name || item.users?.email || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{item.description}</p>
          </div>

          {/* Update Status Button - Only for reporter on lost/found items */}
          {isReporter && (
            <div className="mb-4">
              <UpdateItemStatusButton
                itemId={item.id}
                currentStatus={item.status}
              />
            </div>
          )}

          {/* For LOST items - Chat with Reporter Button */}
          {!isReporter && user && isLostItem && (
            <div className="mb-4">
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
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => setClaimModalOpen(true)}
                className="flex-1"
                disabled={!!userClaim}
                variant={userClaim ? "outline" : "default"}
              >
                <Hand className="mr-2 h-4 w-4" />
                {userClaim ? 'Claim Submitted' : 'This is mine'}
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
