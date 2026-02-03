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

// POST endpoint to accept a store
export async function POST(request: Request) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { accepted: true },
      select: {
        id: true,
        name: true,
        email: true,
        accepted: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Store accepted successfully',
      store 
    })
  } catch (error) {
    console.error('Error accepting store:', error)
    return NextResponse.json(
      { error: 'Failed to accept store', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
