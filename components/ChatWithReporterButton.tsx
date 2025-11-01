'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from './ui/use-toast'
import { MessageCircle, Loader2 } from 'lucide-react'

interface ChatWithReporterButtonProps {
  itemId: number
  reporterId: string
  currentUserId: string
  itemStatus: string
  fullWidth?: boolean
}

export function ChatWithReporterButton({ 
  itemId, 
  reporterId, 
  currentUserId,
  itemStatus,
  fullWidth = true
}: ChatWithReporterButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChatWithReporter = async () => {
    setLoading(true)
    try {
      // Check if claim already exists
      const { data: existingClaim } = await supabase
        .from('claims')
        .select('id')
        .eq('item_id', itemId)
        .eq('claimant_id', currentUserId)
        .single()

      if (existingClaim) {
        // Redirect to chats page with the specific claim
        router.push(`/chats?claimId=${existingClaim.id}`)
        return
      }

      // Get current user's name
      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', currentUserId)
        .single()

      const userName = userData?.name || userData?.email || 'Someone'

      // Create a new chat request (not a claim request)
      const { data: newClaim, error } = await supabase
        .from('claims')
        .insert({
          item_id: itemId,
          claimant_id: currentUserId,
          message: `${userName} would like to discuss this item with you.`,
          status: 'pending',
          chat_type: 'chat'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Chat initiated. Redirecting to chats page...',
      })

      // Redirect to chats page with the new claim
      setTimeout(() => {
        router.push(`/chats?claimId=${newClaim.id}`)
      }, 500)
    } catch (error) {
      console.error('Error initiating chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if user is the reporter
  if (reporterId === currentUserId) {
    return null
  }

  // Don't show button if item is already claimed or returned
  if (itemStatus === 'claimed' || itemStatus === 'returned') {
    return null
  }

  return (
    <Button
      onClick={handleChatWithReporter}
      disabled={loading}
      variant="outline"
      className={fullWidth ? "w-full" : "flex-1"}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting chat...
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat with Reporter
        </>
      )}
    </Button>
  )
}
