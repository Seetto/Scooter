import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyAdminCredentials } from '@/lib/admin-auth'

async function verifyAuth(request: Request): Promise<boolean> {
  // Check session first (for admin logged in via NextAuth)
  const session = await getServerSession(authOptions as any) as any
  if (session && session.user?.isAdmin === true) {
    return true
  }

  // Fallback to Basic auth for backward compatibility
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  try {
    const base64Credentials = authHeader.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [username, password] = credentials.split(':')

    return verifyAdminCredentials(username, password)
  } catch {
    return false
  }
}

// DELETE endpoint to delete a store and all related data
export async function DELETE(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { storeId } = await context.params

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        scooters: {
          select: { id: true },
        },
        bookings: {
          select: { id: true },
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Delete the store - this will cascade delete all scooters and bookings
    // due to onDelete: Cascade in the schema
    await prisma.store.delete({
      where: { id: storeId },
    })

    return NextResponse.json({
      success: true,
      message: 'Store deleted successfully. All related scooters and bookings have been removed.',
      deleted: {
        store: store.name,
        scooters: store.scooters.length,
        bookings: store.bookings.length,
      },
    })
  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json(
      { error: 'Failed to delete store', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
