import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyAdminCredentials } from '@/lib/admin-auth'

async function isAuthorized(request: Request): Promise<boolean> {
  // Check session first (for admin logged in via NextAuth)
  const session = await getServerSession(authOptions as any)
  if (session && (session.user as any)?.isAdmin === true) {
    return true
  }

  // Fallback to Basic auth for backward compatibility
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) return false

  try {
    const base64Credentials = authHeader.slice('Basic '.length).trim()
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8')
    const [username, password] = decoded.split(':')

    return verifyAdminCredentials(username, password)
  } catch {
    return false
  }
}

// GET endpoint to view all users (for admin/debugging purposes)
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a user by ID
export async function DELETE(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const deletedUser = await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, user: deletedUser })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
