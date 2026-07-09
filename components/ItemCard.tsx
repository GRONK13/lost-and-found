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
    <Card className="group h-full overflow-hidden rounded-2xl border bg-card/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-1 relative backdrop-blur-sm flex flex-col justify-between">
      <Link href={`/items/${item.id}`} className="flex-1 flex flex-col">
        <CardHeader className="p-0 overflow-hidden">
          {item.photo_url ? (
            <div className="relative h-48 sm:h-56 w-full">
              <Image
                src={item.photo_url}
                alt={item.title}
                fill
                className="object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="h-48 sm:h-56 w-full bg-muted rounded-t-2xl flex items-center justify-center">
              <p className="text-muted-foreground text-xs font-semibold">No image available</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </CardTitle>
              <StatusBadge status={item.status as any} />
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border-primary/20 text-primary">
              {item.category}
            </Badge>
            {item.campus && (
              <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                {item.campus === 'TC' ? 'Talamban Campus (TC)' : 'Downtown Campus (DC)'}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-3 pb-3 px-4">
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="line-clamp-1">{item.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3 text-secondary shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </CardFooter>
      </Link>

      {isOwner && (
        <div className="px-4 pb-4 flex gap-2 pt-3 border-t border-border/40 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9 hover:bg-muted font-semibold"
            onClick={handleEdit}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-9 hover:bg-muted font-semibold"
                disabled={updating || item.status === 'returned'}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-secondary" />
                {item.status === 'returned' ? 'Returned' : 'Mark as Returned'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()} className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as Returned?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the item as returned. You can still edit or view it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsReturned} className="bg-primary text-primary-foreground brand-button-hover font-semibold">
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
