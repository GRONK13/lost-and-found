import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const adminUser = await getCurrentUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const flagId = Number(id)

    if (!Number.isFinite(flagId)) {
      return NextResponse.json({ error: 'Invalid flag ID' }, { status: 400 })
    }

    await db.flag.delete({
      where: { id: flagId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resolving flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
