const fs = require('fs/promises')
const fsSync = require('fs')
const path = require('path')

// Load .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fsSync.existsSync(envPath)) {
    const envConfig = fsSync.readFileSync(envPath, 'utf8')
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=')
        const val = values.join('=').replace(/^["']|["']$/g, '').trim()
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val
        }
      }
    }
  }
} catch (e) {
  console.error('Error loading .env.local:', e)
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function rollback() {
  console.log('🔄 Initiating MariaDB Rollback to Pre-Migration Snapshot...')

  const backupPath = path.join(__dirname, 'backups', 'mariadb-backup-latest.json')
  
  try {
    const raw = await fs.readFile(backupPath, 'utf8')
    const snapshot = JSON.parse(raw)

    console.log(`Snapshot found from ${snapshot.backedUpAt}`)
    console.log('Target Counts:', snapshot.counts)

    console.log('🧹 Cleaning MariaDB tables...')
    await prisma.flag.deleteMany({})
    await prisma.message.deleteMany({})
    await prisma.claim.deleteMany({})
    await prisma.item.deleteMany({})
    await prisma.user.deleteMany({})

    if (snapshot.users.length > 0) {
      console.log(`Restoring ${snapshot.users.length} Users...`)
      for (const u of snapshot.users) {
        await prisma.user.create({
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
    }

    if (snapshot.items.length > 0) {
      console.log(`Restoring ${snapshot.items.length} Items...`)
      for (const item of snapshot.items) {
        await prisma.item.create({
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
    }

    if (snapshot.claims.length > 0) {
      console.log(`Restoring ${snapshot.claims.length} Claims...`)
      for (const c of snapshot.claims) {
        await prisma.claim.create({
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
    }

    if (snapshot.messages.length > 0) {
      console.log(`Restoring ${snapshot.messages.length} Messages...`)
      for (const m of snapshot.messages) {
        await prisma.message.create({
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
    }

    if (snapshot.flags.length > 0) {
      console.log(`Restoring ${snapshot.flags.length} Flags...`)
      for (const f of snapshot.flags) {
        await prisma.flag.create({
          data: {
            id: f.id,
            itemId: f.itemId,
            userId: f.userId,
            reason: f.reason,
            createdAt: new Date(f.createdAt),
          },
        })
      }
    }

    console.log('✨ ROLLBACK COMPLETED SUCCESSFULLY!')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

rollback()
