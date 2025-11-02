'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { StatusBadge } from './StatusBadge'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { MapPin, Calendar, Edit, Trash2, CheckCircle } from 'lucide-react'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Item = Database['public']['Tables']['items']['Row']

interface ItemCardProps {
  item: Item
  showActions?: boolean
  userId?: string
}

export function ItemCard({ item, showActions = false, userId }: ItemCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [updating, setUpdating] = useState(false)

  const handleMarkAsReturned = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUpdating(true)

    try {
      // Update item status to returned
      const { error } = await supabase
        .from('items')
        .update({ status: 'returned' })
        .eq('id', item.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Item marked as returned',
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      })
      setUpdating(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/items/${item.id}/edit`)
  }

  const isOwner = showActions && userId && item.reporter_id === userId

  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
      <Link href={`/items/${item.id}`}>
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
      </Link>

      {isOwner && (
        <div className="px-4 pb-4 flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={updating || item.status === 'returned'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {item.status === 'returned' ? 'Returned' : 'Mark as Returned'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as Returned?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the item as returned. You can still edit or view it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsReturned} className="bg-primary text-primary-foreground">
                  {updating ? 'Updating...' : 'Mark as Returned'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  )
}
