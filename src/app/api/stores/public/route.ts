import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint to get only accepted stores (for map display)
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        accepted: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        phoneNumber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ stores, count: stores.length })
  } catch (error) {
    console.error('Error fetching accepted stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
