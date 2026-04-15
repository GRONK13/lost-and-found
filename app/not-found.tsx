import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-4xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you’re looking for does not exist or was moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Go home</Button>
        </Link>
        <Link href="/items">
          <Button variant="outline">Browse items</Button>
        </Link>
      </div>
    </div>
  )
}
