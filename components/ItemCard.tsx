import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { StatusBadge } from './StatusBadge'
import { Badge } from './ui/badge'
import { MapPin, Calendar } from 'lucide-react'
import { Database } from '@/lib/database.types'

type Item = Database['public']['Tables']['items']['Row']

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/items/${item.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="p-0">
          {item.photo_url ? (
            <div className="relative h-64 w-full">
              <Image
                src={item.photo_url}
                alt={item.title}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="h-64 w-full bg-muted rounded-t-lg flex items-center justify-center">
              <p className="text-muted-foreground">No image</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
            <StatusBadge status={item.status} />
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{item.category}</Badge>
            {item.campus && (
              <Badge variant="secondary" className="text-xs">
                {item.campus === 'TC' ? 'Talamban' : 'Main'}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground pt-0">
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{item.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
