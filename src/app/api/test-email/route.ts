import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  sendBookingReceivedEmail,
  sendNewBookingNotificationEmail,
  sendBookingConfirmedEmail,
} from '@/lib/email'

// POST: Test email sending (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as any
    const isAdmin = session?.user?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const body = await request.json()
    const { email, testType } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    let result

    switch (testType) {
      case 'booking-received':
        result = await sendBookingReceivedEmail(
          email,
          'Test User',
          'Test Store',
          'Test Scooter',
          tomorrow,
          dayAfter,
        )
        break
      case 'new-booking':
        result = await sendNewBookingNotificationEmail(
          email,
          'Test Store',
          'Test User',
          'test@example.com',
          'Test Scooter',
          tomorrow,
          dayAfter,
        )
        break
      case 'booking-confirmed':
        result = await sendBookingConfirmedEmail(
          email,
          'Test User',
          'Test Store',
          'Test Scooter',
          tomorrow,
          dayAfter,
        )
        break
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        details: result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test email',
          details: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
