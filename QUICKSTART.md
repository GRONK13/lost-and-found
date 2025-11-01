# Lost & Found Portal - Quick Start Guide

## 🚀 Getting Started

Your Lost & Found Portal scaffold is complete! Follow these steps to get it running.

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Supabase client libraries
- shadcn/ui components
- Tailwind CSS
- Zod for validation
- And more...

### Step 2: Set Up Supabase

1. **Create a Supabase project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose a name and password

2. **Run the database schema**
   - Open the SQL Editor in Supabase
   - Copy and paste the content of `db/schema.sql`
   - Click "Run" to create all tables
   - Then copy and paste `db/policies.sql`
   - Click "Run" to enable Row-Level Security

3. **Create storage bucket**
   - Go to Storage in Supabase dashboard
   - Click "Create a new bucket"
   - Name it `item-photos`
   - Make it **public**

4. **Get your API keys**
   - Go to Settings → API
   - Copy the Project URL
   - Copy the anon/public key
   - Copy the service_role key (keep this secret!)

### Step 3: Configure Environment

Create `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SITE_URL=http://localhost:3000
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## 📋 What's Included

### ✅ Complete File Structure
- ✅ Next.js 14 App Router configuration
- ✅ TypeScript setup
- ✅ Tailwind CSS configured
- ✅ shadcn/ui components installed

### ✅ Database
- ✅ Full schema with users, items, claims, flags tables
- ✅ Row-Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updates

### ✅ Components
- ✅ Navbar with auth state
- ✅ ItemCard for displaying items
- ✅ ClaimCard for managing claims
- ✅ FiltersBar for search/filtering
- ✅ StatusBadge for item statuses
- ✅ All shadcn/ui primitives (Button, Card, Input, etc.)

### ✅ Pages Created
- ✅ Home page (app/page.tsx)
- ✅ Items list (app/items/page.tsx)
- ✅ Login page (app/auth/login/page.tsx)
- ✅ Register page (app/auth/register/page.tsx)
- ✅ Layout with navbar (app/layout.tsx)

### ✅ Docker Support
- ✅ Dockerfile for production builds
- ✅ docker-compose.yml for easy deployment
- ✅ .dockerignore configured

## 🔧 What You Need to Build

Due to the scope of the project, here are the remaining pages you'll want to create. **See BUILDING-GUIDE.md for complete code examples!**

### Priority Pages to Create

#### 1. ClaimForm Component (`components/ClaimForm.tsx`) ⭐ START HERE
- Client component for submitting claims
- Textarea for claim message (10-500 chars)
- Submit button with loading state
- Uses Supabase to insert claim
- Toast notifications for success/error
- **Why first?** Needed by Item Detail page

#### 2. Item Detail Page (`app/items/[id]/page.tsx`) ⭐ HIGH PRIORITY
- Show full item details with photo
- Display reporter info, location, date
- Embedded ClaimForm (if not the reporter)
- Show claims list (if you're the reporter)
- Approve/reject claims functionality
- Uses dynamic route parameter `[id]`
- **Already linked from ItemCard component**

#### 3. Report Item Page (`app/report/page.tsx`) ⭐ HIGH PRIORITY
- Form to create new lost/found items
- Fields: title, description, category, status, location
- Photo upload with preview
- Client component with form handling
- Calls Supabase insert on submit
- Redirects to /items on success
- **Already linked from Navbar and home page**

#### 4. Profile Page (`app/profile/page.tsx`)
- Server component fetching user data
- Tabs for "My Reported Items" and "My Claims"
- Grid of ItemCards for reported items
- List of ClaimCards for user's claims
- Protected route (requires auth)
- **Already linked from Navbar dropdown**

#### 5. Claims Page (`app/claims/page.tsx`) - OPTIONAL
- Alternative view of user's claims
- Filter by status (pending/approved/rejected)
- Manage claims from one place

#### 6. Admin Page (`app/admin/page.tsx`) - OPTIONAL
- View all items (including hidden)
- Toggle item visibility
- View and manage flags
- User role management
- **Only accessible to admin users**

### Additional Components Needed

#### Tabs Component (shadcn/ui)
Run this command to add it:
```bash
npx shadcn-ui@latest add tabs
```

This is needed for the Profile page to show different views.

### Middleware for Auth Protection (`middleware.ts`)

Create this file in the **root directory** to protect routes:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if accessing protected routes without auth
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

### Recommended Build Order

1. ✅ **ClaimForm component** - Simple, isolated, needed by Item Detail
2. ✅ **Tabs component** - Run `npx shadcn-ui@latest add tabs`
3. ✅ **Item Detail page** - Core functionality, test claims flow
4. ✅ **Report Item page** - Complete the item creation flow
5. ✅ **Middleware** - Protect routes before building profile
6. ✅ **Profile page** - User dashboard
7. ⭐ **Optional: Admin page** - For moderation features
8. ⭐ **Optional: Claims page** - If you want separate claims view

### API Routes vs Server Actions

You can use either pattern:

**Server Actions (Recommended)**
```typescript
// app/actions/items.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  // ... implementation
  revalidatePath('/items')
}
```

**API Routes (Alternative)**
```typescript
// app/api/items/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  // ... implementation
  return NextResponse.json({ success: true })
}
```

Both work fine - Server Actions are more modern and simpler!

## 📝 Example: Creating Item Detail Page

Here's a template to get you started:

```typescript
// app/items/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: item } = await supabase
    .from('items')
    .select('*, users(name, email)')
    .eq('id', params.id)
    .single()
  
  if (!item) notFound()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {item.photo_url ? (
            <Image 
              src={item.photo_url} 
              alt={item.title}
              width={600}
              height={400}
              className="rounded-lg"
            />
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              No image
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          <div className="flex gap-2 mb-4">
            <StatusBadge status={item.status} />
            <Badge>{item.category}</Badge>
          </div>
          <p className="text-muted-foreground mb-4">{item.description}</p>
          {/* Add claim form here */}
        </div>
      </div>
    </div>
  )
}
```

## 🎯 Testing the Application

1. **Sign up** at http://localhost:3000/auth/register
2. **Log in** at http://localhost:3000/auth/login
3. **Browse items** at http://localhost:3000/items
4. Build the **report page** to create your first item
5. Build the **item detail page** to view and claim items

## 🐳 Docker Deployment

When ready for production:

1. Create `.env` file with production values
2. Run: `docker-compose up --build`
3. Access at http://localhost:3000

## 🔐 Making an Admin User

After signing up, run this SQL in Supabase:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 📚 Key Patterns

### Server Components (Default)
- Fetch data directly with Supabase server client
- No loading states needed

### Client Components
- Use `'use client'` directive
- Use Supabase browser client
- Handle interactive UI

### Server Actions
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  // ... implementation
}
```

## 🆘 Troubleshooting

**TypeScript Errors?**
- The errors you see are expected before running `npm install`
- All dependencies will resolve after installation

**Supabase Connection Issues?**
- Double-check your `.env.local` file
- Ensure RLS policies are enabled (run policies.sql)
- Verify the storage bucket exists

**Build Errors?**
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

## 📞 Next Steps

1. Install dependencies: `npm install`
2. Set up Supabase (follow Step 2 above)
3. Configure `.env.local`
4. Run `npm run dev`
5. Start building the remaining pages!

## 🎉 You're All Set!

The foundation is complete. You have:
- ✅ Full authentication system
- ✅ Database with RLS
- ✅ Beautiful UI components
- ✅ Core pages (home, items list, auth)
- ✅ Docker deployment ready

Build the remaining pages using the patterns established in the existing code. Good luck with your Lost & Found Portal!
