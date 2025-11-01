'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { toast } from './ui/use-toast'
import { Database } from '@/lib/database.types'

type Claim = Database['public']['Tables']['claims']['Row'] & {
  items?: Database['public']['Tables']['items']['Row']
  users?: { name: string | null; email: string }
}

interface ClaimCardProps {
  claim: Claim
  onUpdate?: () => void
  showItemDetails?: boolean
  canApprove?: boolean
}

export function ClaimCard({ claim, onUpdate, showItemDetails = false, canApprove = false }: ClaimCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateClaim = async (newStatus: 'approved' | 'rejected') => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/claims/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: claim.id, status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update claim')

      toast({
        title: 'Success',
        description: `Claim ${newStatus}`,
      })

      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update claim',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const statusColor = {
    pending: 'default',
    approved: 'default',
    rejected: 'destructive',
  } as const

  const formattedDate = new Date(claim.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            {showItemDetails && claim.items && (
              <h3 className="font-semibold">{claim.items.title}</h3>
            )}
            {claim.users && (
              <p className="text-sm text-muted-foreground">
                {claim.users.name || claim.users.email}
              </p>
            )}
          </div>
          <Badge variant={statusColor[claim.status]}>
            {claim.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm">{claim.message}</p>
        <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
      </CardContent>

      {canApprove && claim.status === 'pending' && (
        <CardFooter className="gap-2">
          <Button
            size="sm"
            onClick={() => handleUpdateClaim('approved')}
            disabled={isUpdating}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleUpdateClaim('rejected')}
            disabled={isUpdating}
          >
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
