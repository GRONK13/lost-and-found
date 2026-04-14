'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface AdminItemActionsProps {
  itemId: number
  hidden: boolean
}

export function AdminItemActions({ itemId, hidden }: AdminItemActionsProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  const handleToggleVisibility = async () => {
    setUpdating(true)

    try {
      const response = await fetch(`/api/admin/items/${itemId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hidden: !hidden }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update visibility')
      }

      toast({
        title: hidden ? 'Item is visible again' : 'Item hidden',
        description: hidden
          ? 'The item now appears for all users.'
          : 'The item is hidden from public listings.',
      })

      router.refresh()
    } catch (error) {
      console.error('Visibility update failed:', error)
      toast({
        title: 'Update failed',
        description: 'Could not update this item right now.',
        variant: 'destructive',
      })
      setUpdating(false)
    }
  }

  return (
    <Button
      type="button"
      variant={hidden ? 'default' : 'outline'}
      size="sm"
      className="w-full"
      onClick={handleToggleVisibility}
      disabled={updating}
    >
      {hidden ? (
        <>
          <Eye className="h-4 w-4 mr-2" />
          {updating ? 'Restoring...' : 'Unhide Item'}
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          {updating ? 'Hiding...' : 'Hide Item'}
        </>
      )}
    </Button>
  )
}
