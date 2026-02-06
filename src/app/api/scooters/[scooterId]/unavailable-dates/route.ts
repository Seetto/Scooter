import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: get unavailable dates for a specific scooter
export async function GET(
  request: Request,
  context: { params: Promise<{ scooterId: string }> }
) {
  try {
    const { scooterId } = await context.params

    if (!scooterId) {
      return NextResponse.json({ error: 'Scooter ID is required' }, { status: 400 })
    }

    // Get all confirmed and pending bookings for this scooter that haven't ended yet
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const bookings = await prisma.booking.findMany({
      where: {
        scooterId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        // Only include bookings that haven't ended yet (endDate >= today)
        endDate: {
          gte: today,
        },
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    // Convert bookings to date ranges (array of date strings in YYYY-MM-DD format)
    // Only include dates that are today or in the future (for display purposes)
    const unavailableDates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    bookings.forEach((booking) => {
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      // Only include dates that are today or in the future
      const checkStart = start >= today ? start : today
      
      // Only process if the booking hasn't ended (for unavailable dates display)
      if (end >= today) {
        // Generate all dates in the range
        const currentDate = new Date(checkStart)
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0]
          if (!unavailableDates.includes(dateStr)) {
            unavailableDates.push(dateStr)
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    return NextResponse.json({
      unavailableDates: unavailableDates.sort(),
      bookings: bookings.map((b) => ({
        startDate: b.startDate.toISOString().split('T')[0],
        endDate: b.endDate.toISOString().split('T')[0],
        status: b.status,
      })),
    })
  } catch (error) {
    console.error('Error fetching unavailable dates:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch unavailable dates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
