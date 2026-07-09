'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

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

      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
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
    <Card className="glass-card border-primary/10 rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            {showItemDetails && claim.items && (
              <h3 className="font-extrabold text-base text-foreground">{claim.items.title}</h3>
            )}
            {claim.users && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Submitted by: <span className="font-semibold text-foreground">{claim.users.name || claim.users.email}</span>
              </p>
            )}
          </div>
          <Badge variant={statusColor[claim.status] === 'default' ? (claim.status === 'approved' ? 'default' : 'secondary') : 'destructive'} className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5">
            {claim.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-2">
        <p className="text-sm leading-relaxed text-foreground bg-muted/40 p-3.5 rounded-xl border border-border/30">{claim.message}</p>
        <div className="text-[11px] text-muted-foreground flex items-center justify-end">
          <span>{formattedDate}</span>
        </div>
      </CardContent>

      {canApprove && claim.status === 'pending' && (
        <CardFooter className="gap-2 pt-0 pb-4 px-6">
          <Button
            size="sm"
            onClick={() => handleUpdateClaim('approved')}
            disabled={isUpdating}
            className="brand-button-hover bg-primary text-primary-foreground font-bold shadow-sm h-9 px-4 rounded-lg"
          >
            Approve Claim
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleUpdateClaim('rejected')}
            disabled={isUpdating}
            className="font-bold h-9 px-4 rounded-lg"
          >
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
