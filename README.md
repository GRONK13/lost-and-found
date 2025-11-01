# Lost & Found Portal

A full-stack Lost & Found web application built with Next.js, Supabase, and shadcn/ui.

## 🚀 Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Item Management**: Report lost/found items with photos
- **Claims System**: Users can claim items; original posters approve/reject claims
- **Role-Based Access**: User and Admin roles with different permissions
- **Search & Filter**: Browse items by category, status, location, and keywords
- **Admin Moderation**: Admins can hide inappropriate items and view flags
- **Row-Level Security**: Supabase RLS policies protect all data
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components
- **Docker Support**: Easy deployment with Docker and docker-compose

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for item photos)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Deployment**: Docker + docker-compose

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Docker and Docker Compose (for deployment)

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
2. Go to **SQL Editor** and run the schema:
   - First run `db/schema.sql`
   - Then run `db/policies.sql`

3. Create a storage bucket for item photos:
   - Go to **Storage** → Create a new bucket called `item-photos`
   - Make it **public** so uploaded images can be displayed

4. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy the Project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SITE_URL=http://localhost:3000
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

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`.

### Environment Variables for Docker

Create a `.env` file for production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SITE_URL=https://your-production-domain.com
```

## 📁 Project Structure

```
lost-and-found/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page
│   ├── items/               # Items list and detail pages
│   ├── report/              # Report item page
│   ├── profile/             # User profile
│   ├── claims/              # User claims management
│   ├── admin/               # Admin panel
│   └── auth/                # Login/Register pages
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── Navbar.tsx
│   ├── ItemCard.tsx
│   ├── ClaimCard.tsx
│   ├── FiltersBar.tsx
│   └── StatusBadge.tsx
├── lib/                     # Utility functions
│   ├── supabase/           # Supabase client configuration
│   ├── schemas.ts          # Zod validation schemas
│   ├── storage.ts          # File upload utilities
│   └── database.types.ts   # TypeScript types for database
├── db/                      # Database SQL files
│   ├── schema.sql          # Tables and indexes
│   └── policies.sql        # Row-Level Security policies
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔐 Database Schema

### Tables

- **users**: User profiles with roles (user/admin)
- **items**: Lost and found items with photos
- **claims**: Claims on items by users
- **flags**: User reports for inappropriate items

### Row-Level Security (RLS)

All tables have RLS enabled with granular policies:

- Users can only update their own data
- Items are visible to everyone (unless hidden)
- Claims are visible to claimants and item reporters
- Only admins can view flags
- Reporters can approve/reject claims on their items

## 🎯 User Flows

### Report an Item

1. User logs in
2. Clicks "Report Item"
3. Fills form (title, description, category, location, photo)
4. Item is created with status "lost" or "found"

### Claim an Item

1. User browses items
2. Clicks on an item
3. Submits a claim with a message explaining why it's theirs
4. Claim status is "pending"

### Approve/Reject Claims (Item Reporter)

1. Reporter views their items
2. Sees pending claims
3. Approves → item status changes to "claimed"
4. Rejects → claim status changes to "rejected"

### Admin Moderation

1. Admin views all items (including hidden)
2. Can hide inappropriate items
3. Views flagged items from users
4. Can delete items if necessary

## 🧪 Testing

After setup, test the following:

1. **Sign up** a new user
2. **Report** a lost/found item with a photo
3. **Browse** items with filters
4. **Claim** an item
5. **Approve/Reject** the claim (as the reporter)
6. **Create an admin** user and test moderation features

## 📝 API Routes & Server Actions

The application uses Next.js Server Actions for data mutations:

- Item CRUD operations
- Claim management
- Admin moderation
- User authentication

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

MIT License

## 🆘 Troubleshooting

### Dependencies not installing

Make sure you have Node.js 18+ installed:

```bash
node --version
```

### Supabase connection errors

- Verify your `.env.local` file has the correct credentials
- Check that RLS policies are enabled
- Ensure the storage bucket `item-photos` exists and is public

### TypeScript errors

Run the type checker:

```bash
npm run build
```

### Docker build fails

- Ensure Docker is running
- Check that `.env` file exists with production values

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ using Next.js, Supabase, and shadcn/ui**
