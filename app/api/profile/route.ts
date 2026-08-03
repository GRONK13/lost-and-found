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

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    const rawReportedItems = await db.item.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const reportedItems = rawReportedItems.map((item) => ({
      ...item,
      created_at: item.createdAt.toISOString(),
      photo_url: item.photoUrl,
      reporter_id: item.reporterId,
      status: item.status.toLowerCase(),
    }))

    const rawClaims = await db.claim.findMany({
      where: { claimantId: user.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    })

    const claims = rawClaims.map((claim) => ({
      ...claim,
      created_at: claim.createdAt.toISOString(),
      items: {
        ...claim.item,
        created_at: claim.item.createdAt.toISOString(),
        photo_url: claim.item.photoUrl,
        reporter_id: claim.item.reporterId,
        status: claim.item.status.toLowerCase(),
      },
    }))

    return NextResponse.json({ user: userData, reportedItems, claims })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
