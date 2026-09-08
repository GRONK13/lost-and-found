const fs = require('fs/promises')
const fsSync = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

// Load env files
const envFiles = ['.env', '.env.local']
for (const file of envFiles) {
  try {
    const envPath = path.join(__dirname, '..', file)
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
    console.error(`Error loading ${file}:`, e)
  }
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function getStorageDir() {
  const envDir = process.env.PERSISTENT_STORAGE_DIR || process.env.UPLOAD_DIR
  if (envDir && envDir.trim() !== '') {
    return path.resolve(envDir)
  }
  const sibling = path.resolve(__dirname, '..', '..', 'storage', 'uploads')
  if (fsSync.existsSync(sibling)) {
    return sibling
  }
  return path.resolve(__dirname, '..', 'public', 'uploads')
}

async function backupMariaDB() {
  console.log('🛡️ Starting Unified MariaDB & Persistent Storage Backup...')

  const backupDir = path.join(__dirname, 'backups')
  await fs.mkdir(backupDir, { recursive: true })

  // 1. Database Table Backup
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

  console.log(`✅ MariaDB Tables Backup Complete! Saved to ${filename}`)
  console.log('Snapshot Counts:', snapshot.counts)

  // 2. Photos Storage Backup
  const storageDir = getStorageDir()
  console.log(`📁 Archiving photos from storage directory: ${storageDir}`)

  if (fsSync.existsSync(storageDir)) {
    try {
      const photosArchiveName = `photos-backup-${timestamp}.tar.gz`
      const photosArchivePath = path.join(backupDir, photosArchiveName)
      await execAsync(`tar -czf "${photosArchivePath}" -C "${path.dirname(storageDir)}" "${path.basename(storageDir)}"`)
      console.log(`✅ Photos Storage Archive Complete! Saved to ${photosArchiveName}`)
    } catch (err) {
      console.warn('⚠️ Tar compression skipped or not available on system:', err.message)
    }
  }

  console.log('🎉 Unified Backup Finished Successfully!')
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
