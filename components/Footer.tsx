import Link from 'next/link'
import { GraduationCap, HardDrive, MessageSquareText, Search, PlusCircle, ExternalLink, ShieldCheck, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-primary/15 bg-card/60 backdrop-blur-md mt-20 transition-colors">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-secondary shadow-md shadow-primary/20">
                <GraduationCap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-base font-bold tracking-tight leading-none">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">USC DCISM</span>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Carolinian <span className="text-foreground">L&F</span>
                </span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Official lost and found recovery network for the Department of Computer and Information Sciences and Mathematics, University of San Carlos.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Control Room: Beside LB445, Bunzel Bldg</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Portal Navigation
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/items" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-primary" />
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <PlusCircle className="w-3 h-3 text-primary" />
                  Report Discovered Item
                </Link>
              </li>
              <li>
                <Link href="/my-reports" className="hover:text-primary transition-colors">
                  My Submissions
                </Link>
              </li>
              <li>
                <Link href="/claims" className="hover:text-primary transition-colors">
                  My Claims & Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Sister DCISM Services */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-extrabold uppercase tracking-wider">
                Ecosystem
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                DCISM Student Apps
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://drive.dcism.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      DCISM Drive
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Academic cloud storage & resource archive
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="https://wall.dcism.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      DCISM Freedom Wall
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Carolinian community board & student forum
                    </p>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* Guidelines & Department Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              Carolinian Integrity
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restricted exclusively to validated USC email accounts (<code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">@usc.edu.ph</code>).
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please surrender all high-value electronics and official IDs directly to the Lawrence Bunzel Building Control Room.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} University of San Carlos — DCISM. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://drive.dcism.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              drive.dcism.org
            </a>
            <span>•</span>
            <a href="https://wall.dcism.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              wall.dcism.org
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
