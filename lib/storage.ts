import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

/**
 * Multi-tier Persistent Storage Directory Resolver
 * Priority:
 * 1. Explicit PERSISTENT_STORAGE_DIR or UPLOAD_DIR environment variable
 * 2. Sibling directory '../storage/uploads' (dedicated Linux storage outside Git repo)
 * 3. Project root 'public/uploads'
 */
export function getUploadDir(): string {
  // 1. Check explicit environment variable
  const envDir = process.env.PERSISTENT_STORAGE_DIR || process.env.UPLOAD_DIR
  if (envDir && envDir.trim() !== '') {
    return path.resolve(envDir)
  }

  // Determine base project root (even when executed from .next/standalone)
  const cwd = process.cwd()
  const projectRoot = cwd.includes('.next')
    ? path.resolve(cwd.split('.next')[0])
    : path.resolve(cwd)

  // 2. Check if sibling storage directory exists (Linux server structure)
  const siblingStorageDir = path.resolve(projectRoot, '..', 'storage', 'uploads')
  try {
    if (fsSync.existsSync(siblingStorageDir)) {
      return siblingStorageDir
    }
  } catch {}

  // 3. Fallback to project root public/uploads
  return path.resolve(projectRoot, 'public', 'uploads')
}

export async function ensureUploadDir(): Promise<string> {
  const uploadDir = getUploadDir()
  try {
    await fs.mkdir(uploadDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create upload directory:', error)
  }
  return uploadDir
}

export async function uploadItemPhoto(file: File): Promise<string | null> {
  try {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('File too large. Max size is 5MB')
      return null
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/jfif', 'image/pjpeg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|jfif|gif)$/i)) {
      console.error('Invalid file type. Allowed: JPG, PNG, WebP, JFIF, GIF')
      return null
    }

    const uploadDir = await ensureUploadDir()

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = path.join(uploadDir, fileName)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await fs.writeFile(filePath, buffer)

    return `/uploads/${fileName}`
  } catch (error) {
    console.error('Error uploading file locally:', error)
    return null
  }
}

export async function deleteItemPhoto(photoUrl: string): Promise<boolean> {
  try {
    if (!photoUrl || !photoUrl.startsWith('/uploads/')) return false

    const uploadDir = getUploadDir()
    const fileName = photoUrl.replace('/uploads/', '')
    const filePath = path.join(uploadDir, fileName)

    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error('Error deleting local file:', error)
    return false
  }
}
