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
      const updatePromises = bookings
        .filter((booking) => {
          if (booking.status !== 'CONFIRMED') return false
          const endDate = new Date(booking.endDate)
          endDate.setHours(0, 0, 0, 0)
          return endDate < today
        })
        .map((booking) =>
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' },
          }),
        )

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
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
    const updatePromises = bookings
      .filter((booking) => {
        if (booking.status !== 'CONFIRMED') return false
        const endDate = new Date(booking.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      })
      .map((booking) =>
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
        }),
      )

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
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
    const { storeId, scooterId, startDate, endDate, name, phoneNumber } = body
    
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

    // Find an available scooter with the same model (status = AVAILABLE)
    // First, get all scooters with the same model and status AVAILABLE
    const modelScooters = await prisma.scooter.findMany({
      where: {
        storeId,
        model: selectedScooter.model || selectedScooter.name,
        status: 'AVAILABLE' as any, // Type assertion needed until Prisma client is regenerated
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Get the oldest available scooter first
    })

    // Filter out scooters that have conflicting bookings
    const availableScooters = modelScooters.filter((scooter: any) => {
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

    if (availableScooters.length === 0) {
      return NextResponse.json(
        {
          error: 'Scooter is not available for the selected dates',
          details: 'No available scooters of this model for the selected date range',
        },
        { status: 409 },
      )
    }

    // Get the first available scooter
    const availableScooter = availableScooters[0]

    if (!availableScooter) {
      return NextResponse.json(
        {
          error: 'Scooter is not available for the selected dates',
          details: 'No available scooters of this model for the selected date range',
        },
        { status: 409 },
      )
    }

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

    // Create booking with the available scooter
    const booking = await prisma.booking.create({
      data: {
        userId,
        storeId,
        scooterId: availableScooter.id, // Use the available scooter, not the selected one
        startDate: start,
        endDate: end,
      },
      include: {
        store: { select: { id: true, name: true } },
        scooter: { select: { id: true, name: true, model: true } },
      },
    })

    // Update the scooter status to RENTED
    await prisma.scooter.update({
      where: { id: availableScooter.id },
      data: { status: 'RENTED' as any }, // Type assertion needed until Prisma client is regenerated
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
      // Send email to user
      await sendBookingReceivedEmail(
        user.email,
        user.name,
        store.name,
        availableScooter.name || availableScooter.model || 'Scooter',
        start,
        end,
      )

      // Send email to store
      await sendNewBookingNotificationEmail(
        store.email,
        store.name,
        user.name,
        user.email,
        availableScooter.name || availableScooter.model || 'Scooter',
        start,
        end,
      )
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError)
      // Continue even if emails fail - booking is still created
    }

    return NextResponse.json({ booking }, { status: 201 })
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
