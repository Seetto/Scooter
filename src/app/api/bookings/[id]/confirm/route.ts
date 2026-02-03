import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmedEmail } from '@/lib/email'

// POST: confirm a booking (store side)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions as any)
    const storeId = (session as any)?.user?.id as string | undefined
    const isStore = (session as any)?.user?.isStore === true

    if (!storeId || !isStore) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Fetch booking details before updating (for email)
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        storeId,
        status: 'PENDING',
      },
      include: {
        user: { select: { email: true, name: true } },
        store: { select: { name: true } },
        scooter: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or already processed' },
        { status: 404 },
      )
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
      },
    })

    // Send confirmation email to user (don't fail if email fails)
    try {
      if (booking.scooter) {
        await sendBookingConfirmedEmail(
          booking.user.email,
          booking.user.name,
          booking.store.name,
          booking.scooter.name,
          booking.startDate,
          booking.endDate,
        )
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Continue even if email fails - booking is still confirmed
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json(
      { error: 'Failed to confirm booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

