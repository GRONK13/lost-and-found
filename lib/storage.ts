import fs from 'fs/promises'
import path from 'path'

export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR)
  }

  const cwd = process.cwd()
  if (cwd.includes('.next')) {
    return path.resolve(cwd.split('.next')[0], 'public', 'uploads')
  }

  return path.resolve(cwd, 'public', 'uploads')
}

async function ensureUploadDir() {
  try {
    const uploadDir = getUploadDir()
    await fs.mkdir(uploadDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create upload directory:', error)
  }
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
      console.error('Invalid file type. Allowed: JPG, PNG, WebP, JFIF')
      return null
    }

    await ensureUploadDir()

    const uploadDir = getUploadDir()
    const fileExt = file.name.split('.').pop() || 'jpg'
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
