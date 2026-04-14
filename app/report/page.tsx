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
import { Loader2 } from 'lucide-react'

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Report an Item</CardTitle>
          <CardDescription>
            Help reunite lost items with their owners or find your lost belongings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={100}
                placeholder="e.g., Blue backpack with laptop"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                placeholder="Provide details that will help identify the item..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ID">ID</SelectItem>
                    <SelectItem value="Gadget">Gadget</SelectItem>
                    <SelectItem value="Book">Book</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  placeholder="e.g., Library 3rd floor"
                />
              </div>

              <div>
                <Label htmlFor="campus">Campus *</Label>
                <Select value={campus} onValueChange={setCampus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TC">Talamban Campus</SelectItem>
                    <SelectItem value="MC">Main Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="photo">Photo *</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Required for new reports. Max file size: 5MB. Accepted formats: JPG, PNG, WebP
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Photo Required</Badge>
              <p className="text-xs text-muted-foreground">New reports must include an image.</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Report Item'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
