'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from './ui/use-toast'

interface ClaimFormProps {
  itemId: number
}

export function ClaimForm({ itemId }: ClaimFormProps) {
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

      const { error } = await supabase.from('claims').insert({
        item_id: itemId,
        claimant_id: user.id,
        message,
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
    <Card>
      <CardHeader>
        <CardTitle>Claim this item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">
              Why do you think this item is yours?
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Provide details that prove this item belongs to you..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
