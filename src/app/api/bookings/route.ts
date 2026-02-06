import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendBookingReceivedEmail,
  sendNewBookingNotificationEmail,
} from '@/lib/email'

// GET: bookings for current user (rider) or current store
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const isStore = (session as any)?.user?.isStore === true

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date at start of day for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isStore) {
      // Store view: bookings for this store
      const bookings = await prisma.booking.findMany({
        where: { storeId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phoneNumber: true,
              hotelAddress: true,
              idDocumentImageUrl: true,
              damageAgreement: true,
            },
          },
          scooter: { select: { id: true, name: true, model: true, numberPlate: true } },
        },
      })

      // Auto-update CONFIRMED bookings with past end dates to COMPLETED
      const bookingsToComplete = bookings.filter((booking) => {
        if (booking.status !== 'CONFIRMED') return false
        const endDate = new Date(booking.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      })

      const bookingUpdatePromises = bookingsToComplete.map((booking) =>
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
        }),
      )

      // Auto-update scooters with RENTED status back to AVAILABLE if their booking end date has passed
      const scootersToUpdate = bookings
        .filter((booking) => {
          if (!booking.scooterId) return false
          const endDate = new Date(booking.endDate)
          endDate.setHours(0, 0, 0, 0)
          return endDate < today
        })
        .map((booking) => booking.scooterId)
        .filter((id): id is string => id !== null)

      const scooterUpdatePromises = scootersToUpdate.map((scooterId) =>
        prisma.scooter.updateMany({
          where: {
            id: scooterId,
            status: 'RENTED' as any,
          } as any,
          data: { status: 'AVAILABLE' as any } as any,
        }),
      )

      if (bookingUpdatePromises.length > 0 || scooterUpdatePromises.length > 0) {
        await Promise.all([...bookingUpdatePromises, ...scooterUpdatePromises])
        // Refetch bookings to get updated statuses
        const updatedBookings = await prisma.booking.findMany({
          where: { storeId: userId },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                hotelAddress: true,
                idDocumentImageUrl: true,
                damageAgreement: true,
              },
            },
            scooter: { select: { id: true, name: true, model: true, numberPlate: true } },
          },
        })
        return NextResponse.json({ bookings: updatedBookings, role: 'store' })
      }

      return NextResponse.json({ bookings, role: 'store' })
    }

    // Rider view: bookings for this user
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        scooter: { select: { id: true, name: true, model: true, numberPlate: true } },
      },
    })

    // Auto-update CONFIRMED bookings with past end dates to COMPLETED
    const bookingsToComplete = bookings.filter((booking) => {
      if (booking.status !== 'CONFIRMED') return false
      const endDate = new Date(booking.endDate)
      endDate.setHours(0, 0, 0, 0)
      return endDate < today
    })

    const bookingUpdatePromises = bookingsToComplete.map((booking) =>
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      }),
    )

    // Auto-update scooters with RENTED status back to AVAILABLE if their booking end date has passed
    const scootersToUpdate = bookings
      .filter((booking) => {
        if (!booking.scooterId) return false
        const endDate = new Date(booking.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      })
      .map((booking) => booking.scooterId)
      .filter((id): id is string => id !== null)

    const scooterUpdatePromises = scootersToUpdate.map((scooterId) =>
      prisma.scooter.updateMany({
        where: {
          id: scooterId,
          status: 'RENTED' as any,
        } as any,
        data: { status: 'AVAILABLE' as any } as any,
      }),
    )

    if (bookingUpdatePromises.length > 0 || scooterUpdatePromises.length > 0) {
      await Promise.all([...bookingUpdatePromises, ...scooterUpdatePromises])
      // Refetch bookings to get updated statuses
      const updatedBookings = await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          scooter: { select: { id: true, name: true, model: true, numberPlate: true } },
        },
      })
      return NextResponse.json({ bookings: updatedBookings, role: 'user' })
    }

    return NextResponse.json({ bookings, role: 'user' })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

// POST: create a booking for the current user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const isStore = (session as any)?.user?.isStore === true

    console.log('Booking POST - Session check:', { userId, isStore, hasSession: !!session })

    if (!userId || isStore) {
      // Only rider accounts can create bookings
      console.log('Booking POST - Unauthorized:', { userId, isStore })
      return NextResponse.json({ error: 'Unauthorized. Please log in as a rider to create bookings.' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, scooterId, startDate, endDate, name, phoneNumber, quantity = 1 } = body
    
    console.log('Booking POST - Request body:', { storeId, scooterId, startDate, endDate, hasName: !!name, hasPhone: !!phoneNumber })

    if (!storeId || !scooterId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Store, scooter, start date, and end date are required' },
        { status: 400 },
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: 'Please select a valid date range' }, { status: 400 })
    }

    // Fetch the selected scooter to get its model
    const selectedScooter = await prisma.scooter.findUnique({
      where: { id: scooterId },
      select: { 
        id: true,
        name: true,
        model: true,
        storeId: true,
      },
    })

    if (!selectedScooter) {
      return NextResponse.json(
        { error: 'Scooter not found' },
        { status: 404 },
      )
    }

    // Verify the scooter belongs to the correct store
    if (selectedScooter.storeId !== storeId) {
      return NextResponse.json(
        { error: 'Scooter does not belong to the specified store' },
        { status: 400 },
      )
    }

    // Find available scooters with the same model
    // Include both AVAILABLE and RENTED scooters (RENTED scooters whose bookings have ended are available)
    const modelScooters = await prisma.scooter.findMany({
      where: {
        storeId,
        model: selectedScooter.model || selectedScooter.name,
        OR: [
          { status: 'AVAILABLE' as any },
          { status: 'RENTED' as any },
        ],
      } as any,
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Get the oldest scooter first
    })

    // Filter scooters that are available for the selected dates
    const availableScooters = modelScooters.filter((scooter: any) => {
      // For RENTED scooters, check if all their bookings end before the selected start date
      if (scooter.status === 'RENTED') {
        // If there are no active bookings, the scooter is available (booking must have ended)
        if (scooter.bookings.length === 0) {
          return true
        }
        
        // Check if all bookings end before the selected start date
        const allBookingsEndBeforeStart = scooter.bookings.every((booking: any) => {
          const bookingEnd = new Date(booking.endDate)
          bookingEnd.setHours(23, 59, 59, 999) // End of the booking day
          return bookingEnd < start
        })
        
        // Also check that the selected dates don't overlap with any active bookings
        const hasOverlappingBooking = scooter.bookings.some((booking: any) => {
          const bookingStart = new Date(booking.startDate)
          const bookingEnd = new Date(booking.endDate)
          
          // Check if dates overlap
          return (
            (start >= bookingStart && start <= bookingEnd) ||
            (end >= bookingStart && end <= bookingEnd) ||
            (start <= bookingStart && end >= bookingEnd) ||
            (start >= bookingStart && end <= bookingEnd)
          )
        })
        
        return allBookingsEndBeforeStart && !hasOverlappingBooking
      }
      
      // For AVAILABLE scooters, check for date conflicts
      return !scooter.bookings.some((booking: any) => {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        
        // Check if dates overlap
        return (
          (start >= bookingStart && start <= bookingEnd) ||
          (end >= bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd) ||
          (start >= bookingStart && end <= bookingEnd)
        )
      })
    })

    // Check if we have enough available scooters for the requested quantity
    if (availableScooters.length < quantity) {
      return NextResponse.json(
        {
          error: 'Not enough scooters available',
          details: `Only ${availableScooters.length} scooter${availableScooters.length !== 1 ? 's' : ''} available, but ${quantity} requested`,
        },
        { status: 409 },
      )
    }

    // Get the requested number of available scooters
    const scootersToBook = availableScooters.slice(0, quantity)

    // Fetch user and store details for emails
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { email: true, name: true },
    })

    if (!user || !store) {
      return NextResponse.json(
        { error: 'User or store not found' },
        { status: 404 },
      )
    }

    // Create all bookings and update scooter statuses in a transaction
    const bookings = await prisma.$transaction(async (tx) => {
      // Create all bookings
      const createdBookings = await Promise.all(
        scootersToBook.map((scooter: any) =>
          tx.booking.create({
            data: {
              userId,
              storeId,
              scooterId: scooter.id,
              startDate: start,
              endDate: end,
            },
            include: {
              store: { select: { id: true, name: true } },
              scooter: { select: { id: true, name: true, model: true } },
            },
          })
        )
      )

      // Update all scooter statuses to RENTED
      await Promise.all(
        scootersToBook.map((scooter: any) =>
          tx.scooter.update({
            where: { id: scooter.id },
            data: { status: 'RENTED' as any } as any,
          })
        )
      )

      return createdBookings
    })

    // Optionally update user profile details with latest name/phone
    if (name || phoneNumber) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          phoneNumber: phoneNumber || undefined,
        },
      })
    }

    // Send emails (don't fail booking creation if emails fail)
    try {
      // Send email to user for each booking
      for (const booking of bookings) {
        await sendBookingReceivedEmail(
          user.email,
          user.name,
          store.name,
          booking.scooter?.name || booking.scooter?.model || 'Scooter',
          start,
          end,
        )
      }

      // Send email to store (one email for all bookings)
      await sendNewBookingNotificationEmail(
        store.email,
        store.name,
        user.name,
        user.email,
        `${quantity} scooter${quantity !== 1 ? 's' : ''}`,
        start,
        end,
      )
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError)
      // Continue even if emails fail - booking is still created
    }

    // Return the first booking (for backward compatibility) and the count
    return NextResponse.json({ 
      booking: bookings[0],
      bookings: bookings,
      quantity: bookings.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

// DELETE: cancel/delete a booking (store side for pending, or user side for their own bookings)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    const isStore = (session as any)?.user?.isStore === true

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Check if booking exists and belongs to the user/store
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Store can only delete pending bookings for their store
    if (isStore) {
      if (booking.storeId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      if (booking.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Only pending bookings can be cancelled by the store' },
          { status: 400 },
        )
      }
    } else {
      // Users can cancel their own bookings
      if (booking.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
