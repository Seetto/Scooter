import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyAdminCredentials } from '@/lib/admin-auth'

async function verifyAuth(request: Request): Promise<boolean> {
  // Check session first (for admin logged in via NextAuth)
  const session = await getServerSession(authOptions as any)
  if (session && (session.user as any)?.isAdmin === true) {
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

// GET endpoint to view all stores (for admin/debugging purposes)
export async function GET(request: Request) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' } }
    )
  }

  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        latitude: true,
        longitude: true,
        storeFrontImageUrl: true,
        accepted: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ stores, count: stores.length })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
