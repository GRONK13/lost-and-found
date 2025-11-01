'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from './ui/use-toast'
import { CheckCircle, Loader2 } from 'lucide-react'

interface UpdateItemStatusButtonProps {
  itemId: number
  currentStatus: string
}

export function UpdateItemStatusButton({ itemId, currentStatus }: UpdateItemStatusButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateStatus = async () => {
    setLoading(true)
    try {
      // Always change to 'returned' status
      const { error } = await supabase
        .from('items')
        .update({ status: 'returned' })
        .eq('id', itemId)

      if (error) throw error

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

  // Only show for lost or found items (not already returned or claimed)
  if (currentStatus !== 'lost' && currentStatus !== 'found') {
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
