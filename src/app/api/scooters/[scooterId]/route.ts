import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getCurrentStore() {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined
  const isStore = (session as any)?.user?.isStore === true

  if (!userId || !isStore) {
    return null
  }

  const store = await prisma.store.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  return store
}

// PUT: update a scooter
export async function PUT(
  request: Request,
  context: { params: Promise<{ scooterId: string }> }
) {
  try {
    const store = await getCurrentStore()
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scooterId } = await context.params

    // Verify the scooter belongs to the current store
    const existingScooter = await prisma.scooter.findUnique({
      where: { id: scooterId },
      select: { storeId: true },
    })

    if (!existingScooter) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    if (existingScooter.storeId !== store.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      model, 
      numberPlate, 
      vinOrChassisNumber, 
      availableUnits, 
      odometer, 
      condition, 
      pricePerDay,
      status, 
      notes 
    } = body

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }

    if (!numberPlate || typeof numberPlate !== 'string' || numberPlate.trim().length === 0) {
      return NextResponse.json({ error: 'Plate number is required' }, { status: 400 })
    }

    if (!status || !['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 })
    }

    const scooter = await prisma.scooter.update({
      where: { id: scooterId },
      data: {
        name: name || model.trim(), // Use name if provided, otherwise use model
        model: model.trim(),
        numberPlate: numberPlate.trim(),
        vinOrChassisNumber: vinOrChassisNumber?.trim() || null,
        availableUnits: 1, // Always 1 - units are counted by model
        odometer: odometer ? parseInt(String(odometer)) : null,
        condition: condition?.trim() || null,
        pricePerDay: pricePerDay ? parseFloat(String(pricePerDay)) : null,
        status: status,
        notes: notes?.trim() || null,
      },
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

    return NextResponse.json({ scooter })
  } catch (error) {
    console.error('Error updating scooter:', error)
    return NextResponse.json(
      { error: 'Failed to update scooter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: delete a scooter
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ scooterId: string }> }
) {
  try {
    const store = await getCurrentStore()
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scooterId } = await context.params

    // Verify the scooter belongs to the current store
    const existingScooter = await prisma.scooter.findUnique({
      where: { id: scooterId },
      select: { 
        storeId: true,
        name: true,
        model: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!existingScooter) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    if (existingScooter.storeId !== store.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the scooter (bookings will be handled by cascade delete in schema)
    await prisma.scooter.delete({
      where: { id: scooterId },
    })

    return NextResponse.json({ 
      success: true,
      message: `Scooter "${existingScooter.model || existingScooter.name}" has been deleted successfully.`,
      deletedBookings: existingScooter._count.bookings,
    })
  } catch (error) {
    console.error('Error deleting scooter:', error)
    return NextResponse.json(
      { error: 'Failed to delete scooter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
