import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const itemId = Number(id)
    const { status } = await request.json()

    if (!status || !Number.isFinite(itemId)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const item = await db.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.reporterId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.item.update({
      where: { id: itemId },
      data: { status: status.toUpperCase() as any },
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error('Error updating item status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
