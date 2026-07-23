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

async function backupMariaDB() {
  console.log('🛡️ Starting MariaDB table backup...')

  const backupDir = path.join(__dirname, 'backups')
  await fs.mkdir(backupDir, { recursive: true })

  const users = await prisma.user.findMany()
  const items = await prisma.item.findMany()
  const claims = await prisma.claim.findMany()
  const messages = await prisma.message.findMany()
  const flags = await prisma.flag.findMany()

  const snapshot = {
    backedUpAt: new Date().toISOString(),
    counts: {
      users: users.length,
      items: items.length,
      claims: claims.length,
      messages: messages.length,
      flags: flags.length,
    },
    users,
    items,
    claims,
    messages,
    flags,
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `mariadb-backup-${timestamp}.json`
  const filePath = path.join(backupDir, filename)

  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2))

  const latestPath = path.join(backupDir, 'mariadb-backup-latest.json')
  await fs.writeFile(latestPath, JSON.stringify(snapshot, null, 2))

  console.log(`✅ MariaDB Backup Complete! Saved to ${filename}`)
  console.log('Snapshot Counts:', snapshot.counts)
  return snapshot
}

if (require.main === module) {
  backupMariaDB()
    .catch((err) => {
      console.error('Backup failed:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

module.exports = { backupMariaDB }
