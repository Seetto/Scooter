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
      where: { 
        storeId,
        // Show all scooters - RENTED scooters will be marked as "Not Available" on frontend
        status: {
          in: ['AVAILABLE', 'RENTED'] as any,
        } as any,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        model: true,
        numberPlate: true,
        vinOrChassisNumber: true,
        availableUnits: true,
        odometer: true,
        condition: true,
        pricePerDay: true,
        status: true,
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

