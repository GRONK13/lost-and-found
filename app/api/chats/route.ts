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

    // Combined query: Get claims where user is claimant OR item reporter is user in a single request
    const claims = await db.claim.findMany({
      where: {
        chatType: 'CHAT',
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { claimantId: user.id },
          { item: { reporterId: user.id } },
        ],
      },
      include: {
        item: {
          include: {
            reporter: {
              select: { name: true, email: true },
            },
          },
        },
        claimant: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const conversations = claims.map((claim) => {
      const isClaimant = claim.claimantId === user.id
      const otherUser = isClaimant ? claim.item.reporter : claim.claimant
      const role = isClaimant ? ('claimant' as const) : ('reporter' as const)

      return {
        id: claim.id,
        status: claim.status.toLowerCase(),
        created_at: claim.createdAt.toISOString(),
        role,
        otherUserName: otherUser.name || otherUser.email || (isClaimant ? 'Reporter' : 'Claimant'),
        itemTitle: claim.item.title,
        itemId: claim.item.id,
        unreadCount: 0,
      }
    })

    // Batch query: Fetch unread counts for all conversations in a single aggregate query to avoid N+1
    const claimIds = conversations.map((c) => c.id)
    if (claimIds.length > 0) {
      const unreadCounts = await db.message.groupBy({
        by: ['claimId'],
        _count: {
          id: true,
        },
        where: {
          claimId: { in: claimIds },
          read: false,
          senderId: { not: user.id },
        },
      })

      const countsMap = new Map(unreadCounts.map((u) => [u.claimId, u._count.id]))
      for (const conv of conversations) {
        conv.unreadCount = countsMap.get(conv.id) || 0
      }
    }

    return NextResponse.json({
      user,
      conversations,
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
