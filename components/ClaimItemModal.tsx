'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { toast } from './ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'

interface ClaimItemModalProps {
  itemId: number
  itemTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ClaimItemModal({ itemId, itemTitle, isOpen, onClose }: ClaimItemModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create a claim-type claim (not chat-type)
      const { error } = await supabase.from('claims').insert({
        item_id: itemId,
        claimant_id: user.id,
        message,
        chat_type: 'claim',
        status: 'pending'
      })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: 'You have already claimed this item',
            variant: 'destructive',
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: 'Success',
          description: 'Claim submitted! The reporter will review it.',
        })
        setMessage('')
        onClose()
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit claim',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim: {itemTitle}</DialogTitle>
          <DialogDescription>
            Please provide details that prove this item belongs to you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claim-message">
                Why do you think this item is yours?
              </Label>
              <Textarea
                id="claim-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Describe the item in detail, where you lost it, when, and any identifying features..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
