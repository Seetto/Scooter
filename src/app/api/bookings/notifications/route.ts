import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: get notification counts for current user/store
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const isStore = (session as any)?.user?.isStore === true

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isStore) {
      // Store: count of pending bookings
      const pendingCount = await prisma.booking.count({
        where: {
          storeId: userId,
          status: 'PENDING',
        },
      })

      return NextResponse.json({ count: pendingCount, type: 'pending' })
    }

    // User: count of confirmed bookings (active/upcoming ones)
    // This shows when the user has confirmed bookings that are still active
    const now = new Date()
    const confirmedCount = await prisma.booking.count({
      where: {
        userId,
        status: 'CONFIRMED',
        endDate: {
          gte: now, // Only active/upcoming confirmed bookings
        },
      },
    })

    return NextResponse.json({ count: confirmedCount, type: 'confirmed' })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
