import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await db.item.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ items, userId: user.id })
  } catch (error) {
    console.error('Error fetching my reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
