import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const adminUser = await getCurrentUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 })
    }

    const { id: userIdToDelete } = await context.params

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (userIdToDelete === adminUser.id) {
      return NextResponse.json({ error: 'Admins cannot delete their own account' }, { status: 400 })
    }

    await db.user.delete({
      where: { id: userIdToDelete },
    })

    return NextResponse.json({
      success: true,
      message: `User ${userIdToDelete} successfully deleted.`,
    })
  } catch (error: any) {
    console.error('Error deleting user account:', error)
    return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
  }
}
