import { createClient } from './supabase/client'

const BUCKET_NAME = 'item-photos'

export async function uploadItemPhoto(file: File): Promise<string | null> {
  try {
    const supabase = createClient()
    
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
    
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = fileName

    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    console.log('Public URL:', publicUrl)

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteItemPhoto(photoUrl: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Extract path from URL
    const url = new URL(photoUrl)
    const path = url.pathname.split(`/${BUCKET_NAME}/`)[1]
    
    if (!path) return false

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    return !error
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
