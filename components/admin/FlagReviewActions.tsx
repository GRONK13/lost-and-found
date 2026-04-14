'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface FlagReviewActionsProps {
  flagId: number
  itemHidden: boolean
}

export function FlagReviewActions({ flagId, itemHidden }: FlagReviewActionsProps) {
  const router = useRouter()
  const [resolving, setResolving] = useState(false)
  const [hidingAndResolving, setHidingAndResolving] = useState(false)

  const handleResolve = async (hideItem: boolean) => {
    if (hideItem) {
      setHidingAndResolving(true)
    } else {
      setResolving(true)
    }

    try {
      const response = await fetch(`/api/admin/flags/${flagId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hideItem }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to resolve flag')
      }

      toast({
        title: 'Flag resolved',
        description: hideItem
          ? 'The report was resolved and the item was hidden.'
          : 'The report was removed from the moderation queue.',
      })

      router.refresh()
    } catch (error) {
      console.error('Flag resolution failed:', error)
      toast({
        title: 'Action failed',
        description: 'Could not complete this moderation action.',
        variant: 'destructive',
      })
      setResolving(false)
      setHidingAndResolving(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={resolving || hidingAndResolving}
        onClick={() => handleResolve(false)}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        {resolving ? 'Resolving...' : 'Resolve Flag'}
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={itemHidden || resolving || hidingAndResolving}
        onClick={() => handleResolve(true)}
      >
        <EyeOff className="h-4 w-4 mr-2" />
        {hidingAndResolving ? 'Hiding + Resolving...' : 'Hide Item + Resolve'}
      </Button>
    </div>
  )
}
