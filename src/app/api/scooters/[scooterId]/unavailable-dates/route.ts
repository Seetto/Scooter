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

    // Get all confirmed and pending bookings for this scooter
    // We need ALL bookings (not just future ones) to properly check availability
    // The frontend will filter out past bookings when checking overlaps
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const bookings = await prisma.booking.findMany({
      where: {
        scooterId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
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
    // IMPORTANT: A booking ending on date X means the scooter is available starting date X+1
    // So we should only mark dates up to and including the booking end date as unavailable
    const unavailableDates: string[] = []

    // Helper function to format date in local timezone as YYYY-MM-DD
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    bookings.forEach((booking) => {
      // Convert database dates to local dates
      // Database dates might be in UTC, so we need to get the local date components
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      
      // Get local date components (not UTC)
      const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      startLocal.setHours(0, 0, 0, 0)
      endLocal.setHours(0, 0, 0, 0)

      // Only include dates that are today or in the future
      const checkStart = startLocal >= today ? startLocal : today
      
      // Only process if the booking hasn't ended (for unavailable dates display)
      // If booking ends on Feb 6 and today is Feb 7, don't include it
      if (endLocal >= today) {
        // Generate all dates in the range (inclusive of start and end)
        const currentDate = new Date(checkStart)
        while (currentDate <= endLocal) {
          // Use local date formatting to avoid timezone issues
          const dateStr = formatLocalDate(currentDate)
          
          if (!unavailableDates.includes(dateStr)) {
            unavailableDates.push(dateStr)
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    return NextResponse.json({
      unavailableDates: unavailableDates.sort(),
      bookings: bookings.map((b) => {
        const startDate = new Date(b.startDate)
        const endDate = new Date(b.endDate)
        return {
          startDate: formatLocalDate(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())),
          endDate: formatLocalDate(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())),
          status: b.status,
        }
      }),
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
