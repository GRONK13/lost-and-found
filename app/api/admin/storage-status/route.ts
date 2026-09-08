import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUploadDir } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uploadDir = getUploadDir()
    let isWritable = false
    let fileCount = 0
    let totalSizeBytes = 0
    let errorDetail: string | null = null

    try {
      await fs.mkdir(uploadDir, { recursive: true })
      // Test writability
      const testFile = path.join(uploadDir, `.write-test-${Date.now()}.tmp`)
      await fs.writeFile(testFile, 'ok')
      await fs.unlink(testFile)
      isWritable = true

      // Read files
      const files = await fs.readdir(uploadDir)
      for (const file of files) {
        if (file.startsWith('.')) continue
        try {
          const stats = await fs.stat(path.join(uploadDir, file))
          if (stats.isFile()) {
            fileCount++
            totalSizeBytes += stats.size
          }
        } catch {}
      }
    } catch (err: any) {
      errorDetail = err.message
    }

    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      status: isWritable ? 'healthy' : 'degraded',
      uploadDirectory: uploadDir,
      isWritable,
      fileCount,
      totalSizeMB: `${totalSizeMB} MB`,
      totalSizeBytes,
      errorDetail,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
