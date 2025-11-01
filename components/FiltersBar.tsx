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
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={filters.query || ''}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => handleInputChange('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ID">ID</SelectItem>
            <SelectItem value="Gadget">Gadget</SelectItem>
            <SelectItem value="Book">Book</SelectItem>
            <SelectItem value="Clothing">Clothing</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleInputChange('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
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
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="TC">Talamban Campus</SelectItem>
            <SelectItem value="MC">Main Campus</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1">
        <Input
          placeholder="Filter by location..."
          value={filters.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
        />
      </div>
    </div>
  )
}
