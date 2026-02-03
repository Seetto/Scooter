import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint to get scooters for a specific store
export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params

  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
  }

  try {
    const scooters = await prisma.scooter.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        model: true,
        numberPlate: true,
        notes: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ scooters })
  } catch (error) {
    console.error('Error fetching store scooters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scooters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

