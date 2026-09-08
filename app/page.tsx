import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ItemCard } from '@/components/ItemCard'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  Search,
  PlusCircle,
  GraduationCap,
  Sparkles,
  Laptop,
  BookOpen,
  CreditCard,
  Shirt,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  HardDrive,
  MessageSquareText,
  ExternalLink,
  LayoutGrid
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Get current user session first to keep Next.js request context boundary safe
  const user = await getCurrentUser()

  // Optimize queries: run recent items and all stats counts concurrently
  const [items, activeCount, reunitedCount, totalCount] = await Promise.all([
    db.item.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    db.item.count({
      where: {
        hidden: false,
        status: { in: ['LOST', 'FOUND'] },
      },
    }),
    db.item.count({
      where: {
        hidden: false,
        status: 'RETURNED',
      },
    }),
    db.item.count({
      where: { hidden: false },
    }),
  ])

  const categories = [
    { name: 'ID / Documents', value: 'ID', icon: CreditCard, color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Gadgets / Tech', value: 'Gadget', icon: Laptop, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Books & School', value: 'Book', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Clothing & Wearables', value: 'Clothing', icon: Shirt, color: 'text-purple-500 bg-purple-500/10' },
    { name: 'Others', value: 'Other', icon: HelpCircle, color: 'text-slate-500 bg-slate-500/10' },
  ]

  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Decorative gradient elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
          <GraduationCap className="h-4 w-4" />
          University of San Carlos • DCISM
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground animate-fade-in">
          Carolinian <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Lost & Found</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Find what you've lost, return what you've found. A dedicated space for the USC DCISM community to retrieve lost belongings and report discovered items.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/items">
            <Button size="lg" className="w-full sm:w-auto brand-button-hover shadow-lg shadow-primary/25 text-primary-foreground font-semibold px-8 py-6 rounded-xl">
              <Search className="mr-2 h-5 w-5" />
              Browse Catalog
            </Button>
          </Link>

          {user ? (
            <Link href="/report">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover:bg-muted text-foreground border-primary/25 font-semibold px-8 py-6 rounded-xl">
                <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                Report Discovered Item
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover:bg-muted text-foreground border-primary/25 font-semibold px-8 py-6 rounded-xl">
                Create Account
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto bg-card/50 dark:bg-card/40 border border-primary/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
        <div className="text-center p-4 border-r border-border/50">
          <div className="text-3xl sm:text-5xl font-black text-primary tracking-tight">
            {activeCount || 0}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wide">
            Active Reports
          </div>
        </div>
        <div className="text-center p-4 md:border-r border-border/50">
          <div className="text-3xl sm:text-5xl font-black text-secondary tracking-tight">
            {reunitedCount || 0}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wide">
            Items Reunited
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 text-center p-4 border-t md:border-t-0 border-border/50">
          <div className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            {totalCount || 0}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wide">
            Total Logged
          </div>
        </div>
      </div>

      {/* Category Shortcuts */}
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Browse by Category</h2>
          <p className="text-muted-foreground">Select a category below to filter items quickly</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon
            return (
              <Link
                key={cat.value}
                href={`/items?category=${cat.value}`}
                className="group flex flex-col items-center justify-center p-6 bg-card border hover:border-primary/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`p-4 rounded-xl ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-center mt-4 group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Localized Guidelines Section & Showcase Grid */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
        {/* Recent Items Showcase */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Latest reports submitted by the community</p>
            </div>
            <Link href="/items" className="text-sm font-bold text-primary flex items-center gap-1 group hover:underline">
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {items && items.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {items.map((item: any) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-2xl bg-card">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-4 font-medium">No items reported recently</p>
            </div>
          )}
        </div>

        {/* Localized Helpdesk Guidelines Card */}
        <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden space-y-6">
          <div className="absolute -bottom-8 -right-8 text-primary/5 pointer-events-none">
            <GraduationCap className="h-40 w-40" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              Recovery Guide
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              How to Claim Items?
            </h3>
          </div>

          <div className="space-y-4 text-sm relative z-10">
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Browse the list:</span> Search or filter items by category and location.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Verify ownership:</span> Click <span className="font-semibold">"This is mine"</span> on the found item and provide details in the chat.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Meetup/Claim:</span> Coordinate with the reporter via chat or visit the physical helpdesk.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 space-y-3 relative z-10">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              DCISM Department Helpdesk
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For security, high-value items (like phones, laptops, and wallets) are surrendered to the Control Room at:
              <br />
              <span className="font-semibold text-foreground mt-1 block">
                📍 Control Room (Beside LB445), Lawrence Bunzel Bldg
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* DCISM Student Ecosystem Showcase Section */}
      <div className="max-w-6xl mx-auto space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              Connected Carolinian Platforms
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Explore the DCISM Student Ecosystem
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Discover other essential student services created for the USC DCISM community
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* DCISM Drive Card */}
          <a
            href="https://drive.dcism.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/5 p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <HardDrive className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                drive.dcism.org
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-5 space-y-1.5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                DCISM Drive
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Centralized academic cloud storage, syllabus repository, past study materials, and course resource archive for computer science and IT students.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/40 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              Access Student Drive →
            </div>
          </a>

          {/* DCISM Freedom Wall Card */}
          <a
            href="https://wall.dcism.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/5 p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                wall.dcism.org
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-5 space-y-1.5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                DCISM Freedom Wall
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Carolinian community board, anonymous freedom wall, department discussions, student announcements, peer advice, and campus life stories.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/40 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              Visit Freedom Wall →
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
