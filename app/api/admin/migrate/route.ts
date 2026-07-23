import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIGRATION_SECRET = process.env.JWT_SECRET || 'dcism_carolinian_lost_n_found_jwt_secret_key_2026'

const supabaseUrl = 'https://hmrmnvejtomdvowtmklf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm1udmVqdG9tZHZvd3Rta2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyNjgyOSwiZXhwIjoyMDc3NjAyODI5fQ.3YQeowjdx78v3gEObUpyrXU4DC6uniJtBo3zogKxQHw'

export async function POST(request: NextRequest) {
  try {
    // Check authorization: Admin user or secret token
    const user = await getCurrentUser()
    const authHeader = request.headers.get('x-migration-secret')

    if ((!user || user.role !== 'ADMIN') && authHeader !== MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 })
    }

    console.log('🚀 Starting Server-Side Migration from Supabase to MariaDB...')

    // 1. Create MariaDB pre-migration snapshot
    const backupDir = path.join(process.cwd(), 'scripts', 'backups')
    await fs.mkdir(backupDir, { recursive: true })

    const existingUsers = await db.user.findMany()
    const existingItems = await db.item.findMany()
    const existingClaims = await db.claim.findMany()
    const existingMessages = await db.message.findMany()
    const existingFlags = await db.flag.findMany()

    const snapshot = {
      backedUpAt: new Date().toISOString(),
      counts: {
        users: existingUsers.length,
        items: existingItems.length,
        claims: existingClaims.length,
        messages: existingMessages.length,
        flags: existingFlags.length,
      },
      users: existingUsers,
      items: existingItems,
      claims: existingClaims,
      messages: existingMessages,
      flags: existingFlags,
    }

    await fs.writeFile(
      path.join(backupDir, 'mariadb-backup-latest.json'),
      JSON.stringify(snapshot, null, 2)
    )

    // 2. Fetch data from Supabase REST API
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUsers = authData?.users || []

    const { data: publicUsers } = await supabase.from('users').select('*')
    const { data: items } = await supabase.from('items').select('*')
    const { data: claims } = await supabase.from('claims').select('*')
    const { data: messages } = await supabase.from('messages').select('*')
    const { data: flags } = await supabase.from('flags').select('*')

    const defaultPasswordHash = await bcrypt.hash('Kennethoy1', 10)

    // 3. Migrate Users
    const userMap = new Map()

    for (const au of authUsers) {
      userMap.set(au.id, {
        id: au.id,
        email: au.email,
        name: au.user_metadata?.name || null,
        passwordHash: defaultPasswordHash,
        role: 'USER',
        createdAt: au.created_at ? new Date(au.created_at) : new Date(),
      })
    }

    for (const pu of publicUsers || []) {
      const existing = userMap.get(pu.id) || {
        id: pu.id,
        email: pu.email,
        name: pu.name,
        passwordHash: defaultPasswordHash,
        role: pu.role === 'admin' ? 'ADMIN' : 'USER',
        createdAt: pu.created_at ? new Date(pu.created_at) : new Date(),
      }

      userMap.set(pu.id, {
        ...existing,
        email: pu.email || existing.email,
        name: pu.name || existing.name,
        role: pu.role === 'admin' ? 'ADMIN' : 'USER',
        createdAt: pu.created_at ? new Date(pu.created_at) : existing.createdAt,
      })
    }

    let usersMigrated = 0
    for (const u of userMap.values()) {
      await db.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          name: u.name,
          role: u.role,
        },
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          createdAt: u.createdAt,
        },
      })
      usersMigrated++
    }

    // 4. Migrate Items
    let itemsMigrated = 0
    for (const item of items || []) {
      if (!userMap.has(item.reporter_id)) continue

      const normStatus = (item.status || 'LOST').toUpperCase()
      const validStatus = ['LOST', 'FOUND', 'CLAIMED', 'RETURNED'].includes(normStatus)
        ? normStatus
        : 'LOST'

      const normCategory = item.category || 'Other'
      const validCategory = ['ID', 'Gadget', 'Book', 'Clothing', 'Other'].includes(normCategory)
        ? normCategory
        : 'Other'

      const normCampus = (item.campus || 'TC').toUpperCase()
      const validCampus = ['TC', 'MC', 'DC'].includes(normCampus) ? normCampus : 'TC'

      await db.item.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          description: item.description || '',
          category: validCategory as any,
          status: validStatus as any,
          campus: validCampus as any,
          location: item.location || null,
          photoUrl: item.photo_url || null,
          reporterId: item.reporter_id,
          hidden: Boolean(item.hidden),
        },
        create: {
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: validCategory as any,
          status: validStatus as any,
          campus: validCampus as any,
          location: item.location || null,
          photoUrl: item.photo_url || null,
          reporterId: item.reporter_id,
          hidden: Boolean(item.hidden),
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
        },
      })
      itemsMigrated++
    }

    // 5. Migrate Claims
    let claimsMigrated = 0
    for (const claim of claims || []) {
      if (!userMap.has(claim.claimant_id)) continue

      const normStatus = (claim.status || 'PENDING').toUpperCase()
      const validStatus = ['PENDING', 'APPROVED', 'REJECTED'].includes(normStatus)
        ? normStatus
        : 'PENDING'

      const normChatType = (claim.chat_type || 'CLAIM').toUpperCase()
      const validChatType = ['CLAIM', 'CHAT'].includes(normChatType) ? normChatType : 'CLAIM'

      await db.claim.upsert({
        where: { id: claim.id },
        update: {
          message: claim.message || null,
          status: validStatus as any,
          chatType: validChatType as any,
        },
        create: {
          id: claim.id,
          itemId: claim.item_id,
          claimantId: claim.claimant_id,
          message: claim.message || null,
          status: validStatus as any,
          chatType: validChatType as any,
          createdAt: claim.created_at ? new Date(claim.created_at) : new Date(),
        },
      })
      claimsMigrated++
    }

    // 6. Migrate Messages
    let messagesMigrated = 0
    for (const msg of messages || []) {
      await db.message.upsert({
        where: { id: msg.id },
        update: {
          content: msg.content,
          read: Boolean(msg.read),
        },
        create: {
          id: msg.id,
          claimId: msg.claim_id,
          senderId: msg.sender_id,
          content: msg.content,
          read: Boolean(msg.read),
          createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
        },
      })
      messagesMigrated++
    }

    // 7. Verify Final Counts
    const finalCounts = {
      users: await db.user.count(),
      items: await db.item.count(),
      claims: await db.claim.count(),
      messages: await db.message.count(),
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase to MariaDB data migration completed successfully!',
      migrated: {
        users: usersMigrated,
        items: itemsMigrated,
        claims: claimsMigrated,
        messages: messagesMigrated,
      },
      finalDatabaseCounts: finalCounts,
      snapshotCreated: snapshot.backedUpAt,
    })
  } catch (error: any) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
