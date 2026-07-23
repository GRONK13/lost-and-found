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
const bcrypt = require('bcryptjs')
const { backupMariaDB } = require('./backup-mariadb')

const prisma = new PrismaClient()

async function migrate() {
  console.log('🚀 Beginning Supabase to MariaDB Migration...')

  // Step 1: Backup current MariaDB state
  await backupMariaDB()

  // Step 2: Load Supabase export data
  const exportPath = path.join(__dirname, 'backups', 'supabase-export.json')
  const rawExport = await fs.readFile(exportPath, 'utf8')
  const supabaseData = JSON.parse(rawExport)

  console.log('📊 Loaded Supabase Records:', supabaseData.counts)

  const defaultPasswordHash = await bcrypt.hash('Kennethoy1', 10)

  // Step 3: Migrate Users
  const userMap = new Map()

  for (const au of supabaseData.authUsers || []) {
    userMap.set(au.id, {
      id: au.id,
      email: au.email,
      name: au.user_metadata?.name || null,
      passwordHash: defaultPasswordHash,
      role: 'USER',
      createdAt: au.created_at ? new Date(au.created_at) : new Date(),
    })
  }

  for (const pu of supabaseData.publicUsers || []) {
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

  console.log(`👤 Migrating ${userMap.size} Unique User Accounts...`)
  let usersInserted = 0
  for (const user of userMap.values()) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
    usersInserted++
  }
  console.log(`✅ Migrated ${usersInserted} Users.`)

  // Step 4: Migrate Items
  console.log(`📦 Migrating ${supabaseData.items.length} Reported Items...`)
  let itemsInserted = 0
  for (const item of supabaseData.items || []) {
    if (!userMap.has(item.reporter_id)) {
      console.warn(`⚠️ Skipping item #${item.id}: Reporter ${item.reporter_id} not found in users map`)
      continue
    }

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

    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        description: item.description || '',
        category: validCategory,
        status: validStatus,
        campus: validCampus,
        location: item.location || null,
        photoUrl: item.photo_url || null,
        reporterId: item.reporter_id,
        hidden: Boolean(item.hidden),
      },
      create: {
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: validCategory,
        status: validStatus,
        campus: validCampus,
        location: item.location || null,
        photoUrl: item.photo_url || null,
        reporterId: item.reporter_id,
        hidden: Boolean(item.hidden),
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
      },
    })
    itemsInserted++
  }
  console.log(`✅ Migrated ${itemsInserted} Items.`)

  // Step 5: Migrate Claims
  console.log(`📄 Migrating ${supabaseData.claims.length} Claims...`)
  let claimsInserted = 0
  for (const claim of supabaseData.claims || []) {
    if (!userMap.has(claim.claimant_id)) {
      console.warn(`⚠️ Skipping claim #${claim.id}: Claimant ${claim.claimant_id} not found`)
      continue
    }

    const normStatus = (claim.status || 'PENDING').toUpperCase()
    const validStatus = ['PENDING', 'APPROVED', 'REJECTED'].includes(normStatus)
      ? normStatus
      : 'PENDING'

    const normChatType = (claim.chat_type || 'CLAIM').toUpperCase()
    const validChatType = ['CLAIM', 'CHAT'].includes(normChatType) ? normChatType : 'CLAIM'

    await prisma.claim.upsert({
      where: { id: claim.id },
      update: {
        message: claim.message || null,
        status: validStatus,
        chatType: validChatType,
      },
      create: {
        id: claim.id,
        itemId: claim.item_id,
        claimantId: claim.claimant_id,
        message: claim.message || null,
        status: validStatus,
        chatType: validChatType,
        createdAt: claim.created_at ? new Date(claim.created_at) : new Date(),
      },
    })
    claimsInserted++
  }
  console.log(`✅ Migrated ${claimsInserted} Claims.`)

  // Step 6: Migrate Messages
  console.log(`💬 Migrating ${supabaseData.messages.length} Messages...`)
  let messagesInserted = 0
  for (const msg of supabaseData.messages || []) {
    await prisma.message.upsert({
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
    messagesInserted++
  }
  console.log(`✅ Migrated ${messagesInserted} Messages.`)

  // Step 7: Verification Checks
  console.log('\n--- 🔍 MIGRATION VERIFICATION ---')
  const finalUsers = await prisma.user.count()
  const finalItems = await prisma.item.count()
  const finalClaims = await prisma.claim.count()
  const finalMessages = await prisma.message.count()

  console.log(`Users:    MariaDB (${finalUsers}) vs Supabase (${userMap.size})`)
  console.log(`Items:    MariaDB (${finalItems}) vs Supabase (${supabaseData.items.length})`)
  console.log(`Claims:   MariaDB (${finalClaims}) vs Supabase (${supabaseData.claims.length})`)
  console.log(`Messages: MariaDB (${finalMessages}) vs Supabase (${supabaseData.messages.length})`)

  console.log('\n🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!')
}

migrate()
  .catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
