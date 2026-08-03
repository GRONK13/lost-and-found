import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIGRATION_SECRET = process.env.JWT_SECRET || 'dcism_carolinian_lost_n_found_jwt_secret_key_2026'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const authHeader = request.headers.get('x-migration-secret')

    if ((!user || user.role !== 'ADMIN') && authHeader !== MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 })
    }

    console.log('🔄 Initiating MariaDB Rollback to Pre-Migration Snapshot...')

    const backupPath = path.join(process.cwd(), 'scripts', 'backups', 'mariadb-backup-latest.json')
    const raw = await fs.readFile(backupPath, 'utf8')
    const snapshot = JSON.parse(raw)

    // Clear tables
    await db.flag.deleteMany({})
    await db.message.deleteMany({})
    await db.claim.deleteMany({})
    await db.item.deleteMany({})
    await db.user.deleteMany({})

    // Restore Users
    for (const u of snapshot.users || []) {
      await db.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        },
      })
    }

    // Restore Items
    for (const item of snapshot.items || []) {
      await db.item.create({
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          status: item.status,
          campus: item.campus,
          location: item.location,
          photoUrl: item.photoUrl,
          reporterId: item.reporterId,
          hidden: item.hidden,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      })
    }

    // Restore Claims
    for (const c of snapshot.claims || []) {
      await db.claim.create({
        data: {
          id: c.id,
          itemId: c.itemId,
          claimantId: c.claimantId,
          message: c.message,
          status: c.status,
          chatType: c.chatType,
          createdAt: new Date(c.createdAt),
        },
      })
    }

    // Restore Messages
    for (const m of snapshot.messages || []) {
      await db.message.create({
        data: {
          id: m.id,
          claimId: m.claimId,
          senderId: m.senderId,
          content: m.content,
          read: m.read,
          createdAt: new Date(m.createdAt),
        },
      })
    }

    // Restore Flags
    for (const f of snapshot.flags || []) {
      await db.flag.create({
        data: {
          id: f.id,
          itemId: f.itemId,
          userId: f.userId,
          reason: f.reason,
          createdAt: new Date(f.createdAt),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'MariaDB database successfully rolled back to pre-migration snapshot!',
      restoredFromSnapshot: snapshot.backedUpAt,
      restoredCounts: snapshot.counts,
    })
  } catch (error: any) {
    console.error('Rollback error:', error)
    return NextResponse.json({ error: error.message || 'Rollback failed' }, { status: 500 })
  }
}
