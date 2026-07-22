'use client'

import * as React from 'react'
import { Palette, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ColorThemeToggle() {
  const [colorTheme, setColorThemeState] = React.useState<'usc' | 'dcism'>('usc')

  React.useEffect(() => {
    // Read the saved color theme on mount
    const savedTheme = (localStorage.getItem('color-theme') as 'usc' | 'dcism') || 'usc'
    setColorThemeState(savedTheme)
  }, [])

  const changeColorTheme = (newTheme: 'usc' | 'dcism') => {
    const html = document.documentElement
    
    // Remove existing classes
    html.classList.remove('color-theme-usc', 'color-theme-dcism')
    
    // Add the new class
    html.classList.add(`color-theme-${newTheme}`)
    
    // Persist and update state
    localStorage.setItem('color-theme', newTheme)
    setColorThemeState(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted relative">
          <Palette className="h-[1.2rem] w-[1.2rem] text-primary" />
          <span className="sr-only">Choose Color Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-card">
        <DropdownMenuItem onClick={() => changeColorTheme('usc')} className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#005A36] border border-white/20" />
            USC Green & Gold
          </span>
          {colorTheme === 'usc' && <Check className="h-4 w-4 text-primary shrink-0" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeColorTheme('dcism')} className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#0A4D92] border border-white/20" />
            DCISM White & Blue
          </span>
          {colorTheme === 'dcism' && <Check className="h-4 w-4 text-primary shrink-0" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
