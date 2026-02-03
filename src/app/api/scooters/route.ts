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

// GET: list scooters for the current store
export async function GET() {
  try {
    const store = await getCurrentStore()
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scooters = await prisma.scooter.findMany({
      where: { storeId: store.id },
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
    console.error('Error fetching scooters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scooters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: add a new scooter for the current store
export async function POST(request: Request) {
  try {
    const store = await getCurrentStore()
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, model, numberPlate, notes } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Scooter name is required' }, { status: 400 })
    }

    const scooter = await prisma.scooter.create({
      data: {
        storeId: store.id,
        name: name.trim(),
        model: model?.trim() || null,
        numberPlate: numberPlate?.trim() || null,
        notes: notes?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        model: true,
        numberPlate: true,
        notes: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ scooter }, { status: 201 })
  } catch (error) {
    console.error('Error creating scooter:', error)
    return NextResponse.json(
      { error: 'Failed to create scooter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

