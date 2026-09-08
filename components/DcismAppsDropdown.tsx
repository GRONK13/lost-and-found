'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LayoutGrid, HardDrive, MessageSquareText, Search, ExternalLink, Sparkles } from 'lucide-react'

export function DcismAppsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
          title="DCISM Student Services & Apps"
        >
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="sr-only">DCISM Apps</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2 glass-card rounded-2xl shadow-xl border-primary/15">
        <div className="px-3 py-2">
          <DropdownMenuLabel className="p-0 text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            DCISM Student Suite
          </DropdownMenuLabel>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Connected platforms for Carolinian students & faculty
          </p>
        </div>
        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* Current App: Lost & Found */}
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-2.5 bg-primary/10 border border-primary/20 focus:bg-primary/15">
          <a href="/" className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-secondary shrink-0 shadow-sm">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Lost & Found</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Current
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Department item recovery portal
              </p>
            </div>
          </a>
        </DropdownMenuItem>

        {/* DCISM Drive */}
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-2.5 mt-1 hover:bg-muted focus:bg-muted">
          <a
            href="https://drive.dcism.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                  DCISM Drive
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Academic cloud storage & files
              </p>
            </div>
          </a>
        </DropdownMenuItem>

        {/* DCISM Freedom Wall */}
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-2.5 mt-1 hover:bg-muted focus:bg-muted">
          <a
            href="https://wall.dcism.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                  DCISM Freedom Wall
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Community board & discussions
              </p>
            </div>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
