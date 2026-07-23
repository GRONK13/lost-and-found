import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()
    const claimId = Number(id)

    if (!Number.isFinite(claimId) || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.item.reporterId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedClaim = await db.claim.update({
      where: { id: claimId },
      data: { status: status.toUpperCase() as any },
    })

    if (status.toLowerCase() === 'approved' && claim.chatType === 'CLAIM') {
      await db.item.update({
        where: { id: claim.itemId },
        data: { status: 'RETURNED' },
      })
    }

    return NextResponse.json({ success: true, claim: updatedClaim })
  } catch (error) {
    console.error('Error in update claim route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
