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
import { MapPin, Calendar, User, Hand } from 'lucide-react'

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userClaim, setUserClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
        // Check if current user has claimed this item
        const { data } = await supabase
          .from('claims')
          .select(`
            *,
            items!inner(*, users!reporter_id(name, email))
          `)
          .eq('item_id', itemData.id)
          .eq('claimant_id', currentUser.id)
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
          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          
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
           item.status !== 'returned' && 
           !userClaim && (
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => setClaimModalOpen(true)}
                className="flex-1"
              >
                <Hand className="mr-2 h-4 w-4" />
                This is mine
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
