import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '7Zark72502!'

function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

// GET endpoint to view all stores (for admin/debugging purposes)
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' } }
    )
  }

  try {
    const stores = await prisma.store.findMany({
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
