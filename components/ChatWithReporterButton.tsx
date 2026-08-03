'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
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

  const handleChatWithReporter = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          chatType: 'CHAT',
          message: 'Initiated a discussion regarding this item.',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.claim) {
        throw new Error(data.error || 'Failed to start chat')
      }

      toast({
        title: 'Success',
        description: 'Chat initiated. Redirecting to chats...',
      })

      router.push(`/chats?claimId=${data.claim.id}`)
    } catch (error: any) {
      console.error('Error initiating chat:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (reporterId === currentUserId) {
    return null
  }

  const normStatus = itemStatus ? itemStatus.toLowerCase() : ''
  if (normStatus === 'claimed' || normStatus === 'returned') {
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
