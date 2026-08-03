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

    // Get chat-type claims where user is claimant
    const claimsAsClaimant = await db.claim.findMany({
      where: {
        claimantId: user.id,
        chatType: 'CHAT',
        status: { in: ['PENDING', 'APPROVED'] },
      },
      include: {
        item: {
          include: {
            reporter: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get chat-type claims where user is reporter
    const claimsAsReporter = await db.claim.findMany({
      where: {
        item: { reporterId: user.id },
        chatType: 'CHAT',
        status: { in: ['PENDING', 'APPROVED'] },
      },
      include: {
        item: true,
        claimant: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const conversations = [
      ...claimsAsClaimant.map((claim) => ({
        id: claim.id,
        status: claim.status.toLowerCase(),
        created_at: claim.createdAt.toISOString(),
        role: 'claimant' as const,
        otherUserName: claim.item.reporter.name || claim.item.reporter.email || 'Reporter',
        itemTitle: claim.item.title,
        itemId: claim.item.id,
        unreadCount: 0,
      })),
      ...claimsAsReporter.map((claim) => ({
        id: claim.id,
        status: claim.status.toLowerCase(),
        created_at: claim.createdAt.toISOString(),
        role: 'reporter' as const,
        otherUserName: claim.claimant.name || claim.claimant.email || 'Claimant',
        itemTitle: claim.item.title,
        itemId: claim.item.id,
        unreadCount: 0,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Fetch unread count for each conversation
    for (const conv of conversations) {
      const unreadCount = await db.message.count({
        where: {
          claimId: conv.id,
          read: false,
          senderId: { not: user.id },
        },
      })
      conv.unreadCount = unreadCount
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
