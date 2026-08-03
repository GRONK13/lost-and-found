import { Badge } from './ui/badge'

type ItemStatus = 'lost' | 'found' | 'claimed' | 'returned'

interface StatusBadgeProps {
  status: ItemStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = (status || 'lost').toLowerCase() as ItemStatus
  const variants: Record<ItemStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    lost: { variant: 'destructive', label: 'Lost' },
    found: { variant: 'default', label: 'Found' },
    claimed: { variant: 'secondary', label: 'Claimed' },
    returned: { variant: 'outline', label: 'Returned' },
  }

  const config = variants[normalizedStatus] || variants.lost

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
