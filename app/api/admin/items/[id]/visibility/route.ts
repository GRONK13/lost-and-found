import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminUser = await getCurrentUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const itemId = Number(id)
    const { hidden } = await request.json()

    if (!Number.isFinite(itemId) || typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const item = await db.item.update({
      where: { id: itemId },
      data: { hidden },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error updating item visibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
