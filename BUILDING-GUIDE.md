# Remaining Pages & Features to Build

This guide shows you exactly how to complete the Lost & Found Portal. All the foundation is ready!

## 📁 Pages to Create

### 1. Item Detail Page
**File**: `app/items/[id]/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClaimForm } from '@/components/ClaimForm' // You'll create this
import { MapPin, Calendar, User } from 'lucide-react'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      users!reporter_id(name, email)
    `)
    .eq('id', params.id)
    .single()
  
  if (!item) notFound()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get claims if user is the reporter
  let claims = []
  if (user && item.reporter_id === user.id) {
    const { data } = await supabase
      .from('claims')
      .select(`
        *,
        users!claimant_id(name, email)
      `)
      .eq('item_id', item.id)
      .order('created_at', { ascending: false })
    
    claims = data || []
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          {item.photo_url ? (
            <Image 
              src={item.photo_url} 
              alt={item.title}
              width={800}
              height={600}
              className="rounded-lg object-cover w-full"
            />
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>
        
        {/* Details Section */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          
          <div className="flex gap-2 mb-6">
            <StatusBadge status={item.status} />
            <Badge variant="outline">{item.category}</Badge>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{item.location || 'Location not specified'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Reported by {item.users?.name || 'Anonymous'}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
          
          {/* Claim Form - only show if not the reporter and item is available */}
          {user && item.reporter_id !== user.id && item.status !== 'claimed' && (
            <ClaimForm itemId={item.id} />
          )}
          
          {/* Claims List - only for reporter */}
          {user && item.reporter_id === user.id && claims.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Claims on this item</h2>
              <div className="space-y-4">
                {claims.map((claim: any) => (
                  <ClaimCard 
                    key={claim.id} 
                    claim={claim} 
                    canApprove={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 2. Report Item Page
**File**: `app/report/page.tsx`

```typescript
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
import { toast } from '@/components/ui/use-toast'

export default function ReportItemPage() {
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      // Upload photo if provided
      let photoUrl = null
      if (photoFile) {
        photoUrl = await uploadItemPhoto(photoFile)
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create item
      const { error } = await supabase.from('items').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        status: formData.get('status') as string,
        location: formData.get('location') as string,
        photo_url: photoUrl,
        reporter_id: user.id,
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Item reported successfully!',
      })

      router.push('/items')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to report item',
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
                placeholder="e.g., Blue backpack with laptop"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Provide details that will help identify the item..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
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
                <Select name="status" required>
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
              <Label htmlFor="photo">Photo (optional)</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Report Item'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. Profile Page
**File**: `app/profile/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ItemCard } from '@/components/ItemCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's reported items
  const { data: reportedItems } = await supabase
    .from('items')
    .select('*')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })

  // Get user's claims
  const { data: claims } = await supabase
    .from('claims')
    .select(`
      *,
      items(*)
    `)
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>
      
      <div className="mb-8">
        <p className="text-muted-foreground">Email: {user.email}</p>
      </div>

      <Tabs defaultValue="reported">
        <TabsList>
          <TabsTrigger value="reported">My Reported Items</TabsTrigger>
          <TabsTrigger value="claims">My Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="reported" className="mt-6">
          {reportedItems && reportedItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              You haven't reported any items yet
            </p>
          )}
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          {claims && claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={claim} 
                  showItemDetails={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              You haven't made any claims yet
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## 🧩 Components to Create

### ClaimForm Component
**File**: `components/ClaimForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from './ui/use-toast'

interface ClaimFormProps {
  itemId: number
}

export function ClaimForm({ itemId }: ClaimFormProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase.from('claims').insert({
        item_id: itemId,
        claimant_id: user.id,
        message,
      })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Error',
            description: 'You have already claimed this item',
            variant: 'destructive',
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: 'Success',
          description: 'Claim submitted! The reporter will review it.',
        })
        setMessage('')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit claim',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim this item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">
              Why do you think this item is yours?
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Provide details that prove this item belongs to you..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Tabs Component (shadcn/ui)
**File**: `components/ui/tabs.tsx`

You'll need to add this shadcn/ui component. Run:

```bash
npx shadcn-ui@latest add tabs
```

## 🔒 Middleware for Auth Protection

**File**: `middleware.ts` (in root directory)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (!user && (
    request.nextUrl.pathname.startsWith('/report') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/claims') ||
    request.nextUrl.pathname.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## 🚀 Quick Wins - Start Here!

1. **First**: Install dependencies (`npm install`)
2. **Second**: Set up Supabase (follow QUICKSTART.md)
3. **Third**: Create ClaimForm component
4. **Fourth**: Create Item Detail page
5. **Fifth**: Create Report page

The rest can be built incrementally!

## 📝 Notes

- All TypeScript errors will go away after `npm install`
- Use the existing components as templates
- Follow the patterns in the existing code
- Test each page after creating it

Happy coding! 🎉
