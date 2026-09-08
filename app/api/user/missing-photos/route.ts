import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getUploadDir } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ hasMissingPhotos: false, items: [] })
    }

    const userActiveItems = await db.item.findMany({
      where: {
        reporterId: user.id,
        hidden: false,
        status: { in: ['LOST', 'FOUND'] },
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const uploadDir = getUploadDir()
    const itemsWithoutPhotos: Array<{
      id: number
      title: string
      category: string
      status: string
      createdAt: Date
    }> = []

    for (const item of userActiveItems) {
      if (!item.photoUrl || item.photoUrl.trim() === '') {
        itemsWithoutPhotos.push({
          id: item.id,
          title: item.title,
          category: item.category,
          status: item.status,
          createdAt: item.createdAt,
        })
        continue
      }

      // If photoUrl points to a local upload, check if the file physically exists on disk
      if (item.photoUrl.startsWith('/uploads/')) {
        const filename = item.photoUrl.replace('/uploads/', '')
        const filePath = path.join(uploadDir, filename)
        try {
          await fs.access(filePath)
        } catch {
          // File missing from server disk
          itemsWithoutPhotos.push({
            id: item.id,
            title: item.title,
            category: item.category,
            status: item.status,
            createdAt: item.createdAt,
          })
        }
      }
    }

    return NextResponse.json({
      hasMissingPhotos: itemsWithoutPhotos.length > 0,
      items: itemsWithoutPhotos,
    })
  } catch (error) {
    console.error('Error checking missing photos:', error)
    return NextResponse.json({ hasMissingPhotos: false, items: [] })
  }
}
