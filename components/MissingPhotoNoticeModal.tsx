'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, ImagePlus, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'

interface MissingPhotoItem {
  id: number
  title: string
  category: string
  status: string
  createdAt: string
}

export function MissingPhotoNoticeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<MissingPhotoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMissingPhotos = async () => {
      try {
        // Check if user recently dismissed this notice within the last 24 hours
        const dismissedUntil = localStorage.getItem('dismissed_missing_photo_notice_until')
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
          return
        }

        const res = await fetch('/api/user/missing-photos')
        if (!res.ok) return

        const data = await res.json()
        if (data.hasMissingPhotos && data.items?.length > 0) {
          setItems(data.items)
          setIsOpen(true)
        }
      } catch (e) {
        console.error('Error fetching missing photos notice:', e)
      } finally {
        setLoading(false)
      }
    }

    checkMissingPhotos()
  }, [])

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const nextNoticeTime = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('dismissed_missing_photo_notice_until', String(nextNoticeTime))
    setIsOpen(false)
  }

  if (items.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg glass-card border-primary/20 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
              Carolinian Notice
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Hey Carolinian! A quick update on your reported item 📦
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            During our recent server upgrade to make the portal faster, an automated build cleanup unfortunately cleared the photos for a few newly submitted items.
            <br /><br />
            <strong>Good news:</strong> All your item details, room location, description, and claim messages are <strong>100% safe and intact</strong> in our database!
            <br /><br />
            If you have a moment, could you please attach a photo to your report? Having a clear photo helps other Carolinians recognize and return your item much faster. We sincerely apologize for this slight inconvenience! 🙏
          </DialogDescription>
        </DialogHeader>

        {/* List of Affected Items */}
        <div className="space-y-2.5 my-2 max-h-56 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/50 border border-border/60 hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-xs text-foreground truncate block">
                    {item.title}
                  </span>
                  <StatusBadge status={item.status as any} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Category: {item.category}
                </p>
              </div>

              <Link href={`/items/${item.id}/edit`} onClick={() => setIsOpen(false)}>
                <Button size="sm" className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0">
                  <ImagePlus className="w-3.5 h-3.5" />
                  Add Photo
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            I'll do this later
          </Button>

          <Link href="/my-reports" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto text-xs font-bold gap-1.5 rounded-xl">
              View My Reports
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
