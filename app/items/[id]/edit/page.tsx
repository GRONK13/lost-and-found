'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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

export const dynamic = 'force-dynamic'

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    campus: '',
    status: 'lost',
  })
  
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      
      setUser(currentUser)

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'Item not found',
          variant: 'destructive',
        })
        router.push('/my-reports')
        return
      }

      // Check if user owns this item
      if (data.reporter_id !== currentUser.id) {
        toast({
          title: 'Unauthorized',
          description: 'You can only edit your own reports',
          variant: 'destructive',
        })
        router.push('/my-reports')
        return
      }

      setItem(data)
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location || '',
        campus: data.campus || '',
        status: data.status,
      })
      setPhotoPreview(data.photo_url)
      setLoading(false)
    }

    fetchItem()
  }, [params.id, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let photoUrl = item.photo_url

      // Upload new photo if changed
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(fileName, photoFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName)

        photoUrl = publicUrl

        // Delete old photo if it exists
        if (item.photo_url) {
          const oldFileName = item.photo_url.split('/').pop()
          await supabase.storage.from('item-photos').remove([oldFileName])
        }
      }

      const { error } = await supabase
        .from('items')
        .update({
          ...formData,
          photo_url: photoUrl,
        })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Item updated successfully',
      })

      router.push('/my-reports')
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      // Delete photo from storage if exists
      if (item.photo_url) {
        const fileName = item.photo_url.split('/').pop()
        await supabase.storage.from('item-photos').remove([fileName])
      }

      // Delete item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      })

      router.push('/my-reports')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href="/my-reports">
        <Button variant="ghost" size="sm" className="mb-6 hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2 text-primary" />
          Back to My Reports
        </Button>
      </Link>

      <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-primary/10 via-emerald-600/5 to-secondary/10 p-6 sm:p-8 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-secondary">
                <Edit className="w-4 h-4 fill-current" />
              </span>
              Edit Report
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Update the details of your reported item
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-9 font-semibold text-xs shrink-0 shadow-sm" disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your report
                  and remove the data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90">
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Item Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Blue Backpack"
                required
                maxLength={100}
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed description..."
                rows={4}
                required
                maxLength={500}
                className="bg-background/50 border-primary/10 focus-visible:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
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

              <div className="space-y-2">
                <Label htmlFor="status" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Library 2nd floor"
                  maxLength={100}
                  className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campus" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Campus</Label>
                <Select
                  value={formData.campus}
                  onValueChange={(value) => setFormData({ ...formData, campus: value })}
                >
                  <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary h-11">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="TC">Talamban Campus (TC)</SelectItem>
                    <SelectItem value="MC">Downtown Campus (DC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-primary/15 bg-primary/5">
              <Label htmlFor="photo" className="font-bold text-xs uppercase tracking-wider text-primary">Photo</Label>
              {photoPreview && (
                <div className="relative w-full h-48 sm:h-64 mb-3 rounded-xl overflow-hidden border border-border">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="bg-background cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 h-11 flex items-center"
              />
              <p className="text-[11px] text-muted-foreground">
                Upload a new photo to replace the current one (optional)
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1 h-11 brand-button-hover bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-xl">
                {submitting ? 'Updating...' : 'Update Report'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/my-reports')} className="h-11 hover:bg-muted text-foreground border-primary/10 font-bold rounded-xl px-6">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

