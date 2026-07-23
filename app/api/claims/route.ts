import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Claims received (where current user is reporter of item)
    const claimsReceived = await db.claim.findMany({
      where: {
        item: { reporterId: user.id },
      },
      include: {
        item: true,
        claimant: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Claims submitted (where current user is claimant)
    const claimsMade = await db.claim.findMany({
      where: {
        claimantId: user.id,
      },
      include: {
        item: {
          include: {
            reporter: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ claimsReceived, claimsMade, userId: user.id })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, message, chatType = 'CLAIM' } = await request.json()
    const parsedItemId = Number(itemId)

    if (!Number.isFinite(parsedItemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })
    }

    const item = await db.item.findUnique({
      where: { id: parsedItemId },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.reporterId === user.id) {
      return NextResponse.json({ error: 'You cannot claim your own item' }, { status: 400 })
    }

    // Find existing claim or create new
    let claim = await db.claim.findFirst({
      where: {
        itemId: item.id,
        claimantId: user.id,
        chatType: chatType.toUpperCase() as any,
      },
    })

    if (!claim) {
      claim = await db.claim.create({
        data: {
          itemId: item.id,
          claimantId: user.id,
          message: message || null,
          chatType: chatType.toUpperCase() as any,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ success: true, claim })
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
