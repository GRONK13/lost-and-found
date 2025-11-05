# Lost & Found Portal

A modern Lost & Found web application for campus environments, built with Next.js 14, Supabase, and shadcn/ui. This application helps students and staff report and find lost items across campus locations.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure signup/login with Supabase Auth
- **Report Items**: Post lost or found items with photos, descriptions, and campus location
- **Browse & Search**: View all items with real-time search and filter by category, status, and campus
- **Item Management**: Edit, delete, or mark items as returned
- **Campus Filter**: Filter items by Talamban Campus (TC) or Main Campus (MC)

### Communication & Claims
- **Chat System**: Real-time messaging between item reporters and claimants
- **"This is Mine" Claims**: Users can claim found items with verification process
- **Claim Management**: Approve or reject claims on your reported items
- **Unread Message Indicators**: Visual badges show new messages in navbar and chat sidebar
- **All Conversations View**: See all active and archived chats in one place

### User Experience
- **My Reports Page**: View and manage all items you've reported
- **My Claims Page**: Track status of items you've claimed
- **Dark Mode**: Full dark/light theme support with persistent preferences
- **Browser Notifications**: Desktop notifications for new messages
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

### Admin Features
- **Admin Dashboard**: View all items, flagged content, and hidden items
- **Content Moderation**: Hide inappropriate items and review user flags
- **Statistics Overview**: Track total items, claims, and user activity
- **Role-Based Access**: Admin-only features protected by RLS policies

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes & Server Components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)
- **Storage**: Supabase Storage for item photos
- **Real-time**: Supabase Realtime for chat and notifications
- **UI Framework**: 
  - Tailwind CSS for styling
  - shadcn/ui components (Radix UI primitives)
  - next-themes for dark mode
- **Validation**: Zod schemas
- **Deployment**: PM2 process manager on Linux server
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works fine)
- Git for version control

## 🏗️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd lost-and-found
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the database migrations:
   - Navigate to `db/` folder in the project
   - Run `schema.sql` to create tables
   - Run `policies.sql` to set up Row-Level Security
   - Run `migration_add_messages.sql` to add chat functionality
   - Run `migration_add_campus.sql` to add campus filtering

3. Create a storage bucket for item photos:
   - Go to **Storage** → Create bucket named `item-photos`
   - Set it as **public** for image display
   - Configure RLS policy:
     ```sql
     CREATE POLICY "Public Access"
     ON storage.objects FOR SELECT
     USING ( bucket_id = 'item-photos' );
     
     CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     WITH CHECK ( bucket_id = 'item-photos' AND auth.role() = 'authenticated' );
     ```

4. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy the Project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SITE_URL=http://localhost:3000
```

For production deployment, create `.env.production.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SITE_URL=https://your-domain.com
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create an Admin User (Optional)

After signing up, update your user role in Supabase:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## � Deployment

This application is deployed using PM2 process manager on a Linux server.

### PM2 Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Save PM2 configuration:**
   ```bash
   pm2 save
   ```

4. **View logs:**
   ```bash
   pm2 logs lost-and-found
   ```

5. **Restart application:**
   ```bash
   pm2 restart lost-and-found
   ```

### Using the Deployment Script

The project includes `deploy-pm2.sh` for easy deployment:

```bash
./deploy-pm2.sh
```

Options:
1. **Deploy (First Time)** - Initial setup and deployment
2. **Update & Restart** - Pull changes, rebuild, and restart
3. **Start** - Start the application
4. **Stop** - Stop the application
5. **View Logs** - View application logs
6. **Monitor** - Real-time monitoring
7. **Remove** - Remove from PM2

### Environment Configuration

The app runs on **port 20089** as configured in `ecosystem.config.js`.

For production, ensure `.env.production.local` has your Supabase credentials before building.

### Auto-Startup & Auto-Deployment

**Auto-start on server boot** and **auto-deploy on GitHub push** are configured automatically during first deployment.

For detailed setup instructions, see **[AUTO_DEPLOY_SETUP.md](AUTO_DEPLOY_SETUP.md)**

Quick setup:
- ✅ PM2 auto-startup configured during first deployment
- ✅ GitHub webhook at `/api/deploy` for auto-deployment
- ✅ Push to main branch → automatic deployment (like Vercel!)

**Required for auto-deploy:**
1. Add `GITHUB_WEBHOOK_SECRET` to `.env.production.local`
2. Configure webhook in GitHub repo settings
3. Webhook URL: `https://lost-n-found.dcism.org/api/deploy`

## 📁 Project Structure

```
lost-and-found/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home page (browse all items)
│   ├── items/
│   │   └── [id]/
│   │       ├── page.tsx         # Item detail page
│   │       └── edit/
│   │           └── page.tsx     # Edit item page
│   ├── report/page.tsx          # Report new item
│   ├── my-reports/page.tsx      # User's reported items
│   ├── claims/page.tsx          # User's claims
│   ├── chats/
│   │   ├── page.tsx             # Chat interface
│   │   └── all/page.tsx         # All conversations
│   ├── profile/page.tsx         # User profile
│   ├── admin/page.tsx           # Admin dashboard
│   └── auth/
│       ├── login/page.tsx
│       └── register/page.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── Navbar.tsx               # Navigation with unread badges
│   ├── ItemCard.tsx             # Item display card
│   ├── ChatBox.tsx              # Real-time chat component
│   ├── ClaimItemModal.tsx       # "This is mine" modal
│   ├── FiltersBar.tsx           # Search and filter controls
│   └── StatusBadge.tsx          # Status indicators
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   └── server.ts            # Server-side Supabase
│   ├── schemas.ts               # Zod validation schemas
│   ├── storage.ts               # File upload utilities
│   └── database.types.ts        # Generated TypeScript types
├── db/                          # Database migrations
│   ├── schema.sql               # Core tables
│   ├── policies.sql             # RLS policies
│   ├── migration_add_messages.sql    # Chat system
│   └── migration_add_campus.sql      # Campus filter
├── ecosystem.config.js          # PM2 configuration
├── deploy-pm2.sh               # Deployment script
└── package.json
```

## 🔐 Database Schema

### Main Tables

**users**
- Extends Supabase auth.users
- Fields: name, email, role (user/admin), avatar_url
- Automatically created on signup

**items**
- Lost and found item reports
- Fields: title, description, category, status, location, campus, photo_url, reporter_id
- Categories: ID, Gadget, Book, Clothing, Other
- Statuses: lost, found, claimed, pending, returned
- Campus: TC (Talamban), MC (Main)

**claims**
- Item claims by users
- Fields: item_id, claimant_id, message, status, chat_type
- Types: 'claim' (ownership claim) or 'chat' (conversation)
- Statuses: pending, approved, rejected

**messages**
- Real-time chat messages
- Fields: claim_id, sender_id, content, read
- Linked to claims for context

**flags**
- User reports of inappropriate content
- Fields: item_id, user_id, reason
- Admin-only visibility

### Row-Level Security (RLS)

All tables use RLS policies to ensure data security:

- **Users**: Can read all, update only their own profile
- **Items**: Public read access, users can CRUD their own items, admins can hide/delete any
- **Claims**: Visible to claimant and item reporter only
- **Messages**: Visible to participants in the claim
- **Flags**: Admins only

### Real-time Subscriptions

The app subscribes to:
- New messages in active chats
- Claim status updates
- Item updates for live search

## 🎯 User Flows

### Report an Item

1. User logs in
2. Clicks "Report Item" from homepage or navbar
3. Fills form: title, description, category, campus (TC/MC), location
4. Uploads photo (optional but recommended)
5. Item appears in public search and "My Reports" page

### Claim an Item ("This is Mine")

1. User browses items or searches by keywords/category/campus
2. Finds their lost item and clicks "This is mine" button
3. Writes message with identifying details
4. Chat opens automatically for real-time communication
5. Reporter can approve/reject claim from Messages page

### Chat About an Item

1. User clicks "Interested?" on any item
2. Writes message (questions, meetup coordination, etc.)
3. Real-time chat with unread indicators and browser notifications
4. Both parties can communicate until item is returned

### Manage Your Reports

1. Go to "My Reports" from navbar
2. View all your reported items
3. Click "Edit" to update details or replace photo
4. Click "Mark as Returned" when item is returned (status becomes 'returned')
5. Or navigate to item detail page and click "Delete" to remove permanently

### Admin Moderation

1. Admin logs in with admin role account
2. Accesses "Admin Dashboard" from navbar
3. Views all reported items (including hidden)
4. Can hide inappropriate items (hidden from public, kept in database)
5. Reviews user-submitted flags
6. Can delete items if necessary
7. Monitors all claims and conversations

## 🧪 Testing

After completing setup, test these key features:

### Core Functionality
1. **Sign up** - Create a new user account
2. **Report Item** - Create lost/found item with photo upload
3. **Campus Filter** - Switch between TC and MC campus views
4. **Search** - Search by keywords and filter by category
5. **Dark Mode** - Toggle theme and verify persistence

### Communication & Claims
1. **Claim Item** - Click "This is mine" and submit claim message
2. **Chat** - Click "Interested?" and test real-time messaging
3. **Unread Badges** - Verify unread message indicators appear
4. **Browser Notifications** - Test notification permissions and alerts
5. **Approve/Reject** - Reporter approves or rejects claims from Messages

### Item Management
1. **Edit Item** - Navigate to item detail → click Edit → update fields
2. **Mark as Returned** - From My Reports, mark item as returned
3. **Delete Item** - From item detail page, delete your own item
4. **Photo Upload** - Test image upload and replacement

### Admin Features (Requires admin role)
1. **Admin Dashboard** - Access from navbar
2. **Hide Item** - Hide inappropriate content
3. **View Flags** - Check user-reported flags
4. **Monitor All** - View all items including hidden ones

## 📝 API Routes & Server Actions

The application uses Next.js 14 App Router patterns:

- **Server Actions** - Form submissions and mutations (items, claims, messages)
- **Route Handlers** - API endpoints for file uploads and external integrations
- **Server Components** - Data fetching on server side for SEO and performance
- **Client Components** - Interactive UI with real-time Supabase subscriptions

Key patterns:
- `/app/items/[id]/route.ts` - Item detail API
- `/app/api/upload/route.ts` - Photo upload handler
- Server Actions in page components for mutations
- Supabase client initialization in `lib/supabase/client.ts` and `server.ts`

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request with description of changes

Please ensure:
- Code follows existing style and TypeScript conventions
- All tests pass: `npm run build`
- New features include appropriate documentation
- Commits are clear and descriptive

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Feel free to use, modify, and distribute this project as per the MIT License terms.

## 🆘 Troubleshooting

### PM2 Process Not Starting

Check if the process is running:

```bash
pm2 status
```

If not running, check logs for errors:

```bash
pm2 logs lost-and-found
```

Common fixes:
- Verify `.env.production.local` exists with correct Supabase credentials
- Check port 3000 is available: `netstat -ano | findstr :3000`
- Ensure `npm run build` completed successfully

### Supabase Connection Errors

**Issue**: "Failed to fetch" or connection timeout

**Solutions**:
- Verify `.env.local` or `.env.production.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is not paused (free tier pauses after inactivity)
- Verify RLS policies are enabled on all tables
- Test connection from Supabase dashboard SQL editor

### Real-time Chat Not Working

**Issue**: Messages not appearing instantly

**Solutions**:
- Check browser console for Realtime subscription errors
- Verify Supabase Realtime is enabled in project settings
- Ensure RLS policies allow reading messages for claim participants
- Check internet connection (Realtime requires websockets)

### Photo Upload Fails

**Issue**: "Failed to upload photo" error

**Solutions**:
- Verify storage bucket `item-photos` exists in Supabase
- Check bucket is set to **public**
- Add RLS policy to bucket (see Supabase Setup section)
- Ensure file size is under 5MB
- Check file type is image (jpg, png, gif, webp)

### TypeScript / Build Errors

Run type checker to see detailed errors:

```bash
npm run build
```

Common issues:
- Missing dependencies: Run `npm install`
- Outdated packages: Run `npm update`
- Check `tsconfig.json` has correct paths

### Dark Mode Not Persisting

**Issue**: Theme resets on page refresh

**Solutions**:
- Check `next-themes` is installed: `npm list next-themes`
- Verify `ThemeProvider` wraps entire app in `app/layout.tsx`
- Clear browser localStorage and set theme again
- Check browser allows localStorage

### Unread Badges Not Updating

**Issue**: Message count doesn't update

**Solutions**:
- Refresh the page to trigger re-fetch
- Check Realtime subscription is active (browser console)
- Verify `read` field in messages table is boolean
- Clear cache and hard reload (Ctrl+Shift+R)

## 📧 Support

For issues or questions:
- Open a GitHub issue with error details and screenshots
- Check browser console for error messages
- Review PM2 logs: `pm2 logs lost-and-found`

---

**Built (Vibe Coded) with ❤️ using Next.js, Supabase, and shadcn/ui**
