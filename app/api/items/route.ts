import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const campus = searchParams.get('campus')
    const location = searchParams.get('location')
    const query = searchParams.get('query')

    const where: any = {
      hidden: false,
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (campus) {
      where.campus = campus
    }

    if (location) {
      where.location = { contains: location }
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ]
    }

    const items = await db.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}
