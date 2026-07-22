'use client'

import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Search, X } from 'lucide-react'

interface FiltersBarProps {
  onSearch: (filters: {
    query?: string
    category?: string
    status?: string
    location?: string
    campus?: string
  }) => void
  filters: {
    query?: string
    category?: string
    status?: string
    location?: string
    campus?: string
  }
}

export function FiltersBar({ onSearch, filters }: FiltersBarProps) {
  const handleInputChange = (key: string, value: string) => {
    onSearch({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    onSearch({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v)

  return (
    <div className="bg-card/60 backdrop-blur-sm p-5 rounded-2xl border border-primary/10 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={filters.query || ''}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="pl-9 bg-background/50 border-primary/10 focus-visible:ring-primary"
            />
          </div>
        </div>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => handleInputChange('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-44 bg-background/50 border-primary/10 focus:ring-primary">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ID">ID / Documents</SelectItem>
            <SelectItem value="Gadget">Gadgets / Tech</SelectItem>
            <SelectItem value="Book">Books & School</SelectItem>
            <SelectItem value="Clothing">Clothing & Wearables</SelectItem>
            <SelectItem value="Other">Others</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleInputChange('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-44 bg-background/50 border-primary/10 focus:ring-primary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="found">Found</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.campus || 'all'}
          onValueChange={(value) => handleInputChange('campus', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-48 bg-background/50 border-primary/10 focus:ring-primary">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="TC">Talamban Campus (TC)</SelectItem>
            <SelectItem value="MC">Downtown Campus (DC)</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1">
        <Input
          placeholder="Filter by location (e.g. Bunzel Bldg, STB, LRC...)"
          value={filters.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="bg-background/50 border-primary/10 focus-visible:ring-primary"
        />
      </div>
    </div>
  )
}
