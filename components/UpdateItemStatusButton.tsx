'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { toast } from './ui/use-toast'
import { CheckCircle, Loader2 } from 'lucide-react'

interface UpdateItemStatusButtonProps {
  itemId: number
  currentStatus: string
}

export function UpdateItemStatusButton({ itemId, currentStatus }: UpdateItemStatusButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdateStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETURNED' }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Success',
        description: 'Item marked as returned',
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const normStatus = currentStatus ? currentStatus.toLowerCase() : ''

  if (normStatus !== 'lost' && normStatus !== 'found') {
    return null
  }

  return (
    <Button
      onClick={handleUpdateStatus}
      disabled={loading}
      variant="default"
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Returned
        </>
      )}
    </Button>
  )
}
