import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const claimIdParam = searchParams.get('claimId')

    if (!claimIdParam) {
      return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })
    }

    const claimId = Number(claimIdParam)

    const messages = await db.message.findMany({
      where: { claimId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Mark unread messages sent by others as read
    await db.message.updateMany({
      where: {
        claimId,
        read: false,
        senderId: { not: user.id },
      },
      data: { read: true },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { claimId, content } = await request.json()
    const parsedClaimId = Number(claimId)

    if (!parsedClaimId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        claimId: parsedClaimId,
        senderId: user.id,
        content: content.trim(),
        read: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
