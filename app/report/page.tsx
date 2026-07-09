'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadItemPhoto } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Loader2, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ReportItemPage() {
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [campus, setCampus] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!photoFile) {
      toast({
        title: 'Photo required',
        description: 'Please upload a photo before submitting your report.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to report an item',
          variant: 'destructive',
        })
        router.push('/auth/login')
        return
      }

      // Upload photo (required)
      let photoUrl = null
      try {
        console.log('Starting photo upload...')
        photoUrl = await uploadItemPhoto(photoFile)
        console.log('Photo uploaded, URL:', photoUrl)

        if (!photoUrl) {
          throw new Error('Photo upload failed - no URL returned')
        }
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError)
        toast({
          title: 'Upload Error',
          description: 'Failed to upload photo. Please check if the storage bucket "item-photos" exists and is public.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const response = await fetch('/api/items/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          category,
          status,
          location: formData.get('location') as string,
          campus,
          photo_url: photoUrl,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to submit report')
      }

      toast({
        title: payload?.item?.hidden ? 'Report submitted for admin review' : 'Success',
        description: payload?.item?.hidden
          ? 'Your item was automatically hidden by AI moderation and is now awaiting admin review.'
          : 'Item reported successfully!',
      })

      router.push('/items')
      router.refresh()
    } catch (error) {
      console.error('Error reporting item:', error)
      toast({
        title: 'Error',
        description: 'Failed to report item. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-primary/10 via-emerald-600/5 to-secondary/10 p-6 sm:p-8 border-b border-border/50">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-secondary">
              <PlusCircle className="w-5 h-5 fill-current" />
            </span>
            Report an Item
          </CardTitle>
          <CardDescription className="mt-2 text-sm sm:text-base text-muted-foreground">
            Reunite lost items with their owners or find your missing belongings within the USC DCISM community
          </CardDescription>
        </div>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Title / Name of Item <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="e.g. Blue backpack with laptop"
                  className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="ID">ID / Documents</SelectItem>
                    <SelectItem value="Gadget">Gadgets / Tech</SelectItem>
                    <SelectItem value="Book">Books & School</SelectItem>
                    <SelectItem value="Clothing">Clothing & Wearables</SelectItem>
                    <SelectItem value="Other">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Item Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                placeholder="Describe key identifying features (e.g. brand, color, stickers, labels, serial codes)..."
                className="bg-background/50 border-primary/10 focus-visible:ring-primary resize-none"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="status" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Report Type <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary h-11">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="lost">I Lost This</SelectItem>
                    <SelectItem value="found">I Found This</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="campus" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Campus <span className="text-destructive">*</span>
                </Label>
                <Select value={campus} onValueChange={setCampus} required>
                  <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary h-11">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="TC">Talamban Campus (TC)</SelectItem>
                    <SelectItem value="MC">Downtown Campus (DC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="location" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Specific Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  required
                  placeholder="e.g. Bunzel Bldg 3rd Flr Lobby"
                  className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-primary/15 bg-primary/5">
              <Label htmlFor="photo" className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1">
                Upload Photo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="bg-background cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 h-11 flex items-center"
              />
              <p className="text-[11px] text-muted-foreground">
                To prevent spam and false reports, we require an image of the item. Max file size: 5MB. Accepted formats: JPG, PNG, WebP.
              </p>
            </div>

            <Button type="submit" className="w-full h-11 brand-button-hover bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                'Submit Lost & Found Report'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
