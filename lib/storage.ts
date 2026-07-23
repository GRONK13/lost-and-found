import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type. Allowed: JPG, PNG, WebP')
      return null
    }

    await ensureUploadDir()

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = path.join(UPLOAD_DIR, fileName)

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

    const fileName = photoUrl.replace('/uploads/', '')
    const filePath = path.join(UPLOAD_DIR, fileName)

    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error('Error deleting local file:', error)
    return false
  }
}
