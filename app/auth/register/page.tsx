'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Please check your email to verify.',
      })
      router.push('/auth/login')
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="glass-card rounded-2xl border-primary/10 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-primary/10 via-emerald-600/5 to-secondary/10 p-6 border-b border-border/50 text-center">
          <CardTitle className="text-2xl font-extrabold text-foreground">Create Account</CardTitle>
          <CardDescription className="mt-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Join USC DCISM Carolinian L&F
          </CardDescription>
        </div>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
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
                minLength={6}
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 brand-button-hover bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-xl pt-0" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/40">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
