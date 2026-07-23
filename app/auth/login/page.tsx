'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in')
      }

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-primary/10 via-emerald-600/5 to-secondary/10 p-6 border-b border-border/50 text-center">
          <CardTitle className="text-2xl font-extrabold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="mt-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            USC DCISM Carolinian L&F
          </CardDescription>
        </div>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">USC Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="username@usc.edu.ph"
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 brand-button-hover bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-xl pt-0" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/40">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-bold">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
