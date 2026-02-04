import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test 1: Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        tests: {
          envVarSet: false,
          connectionTest: 'skipped',
          queryTest: 'skipped',
        }
      }, { status: 500 })
    }

    // Test 2: Try to connect
    let connectionSuccess = false
    try {
      await prisma.$connect()
      connectionSuccess = true
    } catch (connectError) {
      return NextResponse.json({
        success: false,
        error: `Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`,
        tests: {
          envVarSet: true,
          connectionTest: 'failed',
          queryTest: 'skipped',
        }
      }, { status: 500 })
    }

    // Test 3: Try a simple query to check if tables exist
    let tableCheck = 'unknown'
    let userCount = null
    try {
      userCount = await prisma.user.count()
      tableCheck = 'success'
    } catch (queryError) {
      const errorMsg = queryError instanceof Error ? queryError.message : 'Unknown error'
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
        tableCheck = 'tables_missing'
      } else {
        tableCheck = 'query_failed'
      }
      
      return NextResponse.json({
        success: false,
        error: `Query failed: ${errorMsg}`,
        tests: {
          envVarSet: true,
          connectionTest: 'success',
          queryTest: tableCheck,
          hint: tableCheck === 'tables_missing' 
            ? 'Run: npx prisma migrate deploy' 
            : 'Check database schema',
        }
      }, { status: 500 })
    }

    // Test 4: Check all required tables
    const tables = ['User', 'Store', 'Scooter', 'Booking']
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        // Try to query each table
        if (table === 'User') {
          await prisma.user.findFirst()
        } else if (table === 'Store') {
          await prisma.store.findFirst()
        } else if (table === 'Scooter') {
          await prisma.scooter.findFirst()
        } else if (table === 'Booking') {
          await prisma.booking.findFirst()
        }
        tableStatus[table] = true
      } catch (err) {
        tableStatus[table] = false
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and queries successful',
      tests: {
        envVarSet: true,
        connectionTest: 'success',
        queryTest: 'success',
        userCount,
        tables: tableStatus,
      },
      connectionString: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'not set',
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}
