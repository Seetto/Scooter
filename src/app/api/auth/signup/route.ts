import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      phoneNumber,
      hotelAddress,
      rentalDuration,
      idDocumentImageUrl,
      damageAgreement,
    } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phoneNumber: phoneNumber || null,
        hotelAddress: hotelAddress || null,
        rentalDuration: rentalDuration || null,
        idDocumentImageUrl: idDocumentImageUrl || null,
        damageAgreement: damageAgreement || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    // Send confirmation email (don't fail signup if email fails)
    try {
      await sendConfirmationEmail(user.email, user.name)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json(
      { message: 'User created successfully. Please check your email for confirmation.', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    // Always return JSON, even on error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'
    
    // Enhanced error logging for debugging
    console.error('Error details:', {
      message: errorMessage,
      name: errorName,
      stack: error instanceof Error ? error.stack : undefined,
      // Log Prisma-specific error details
      ...(error && typeof error === 'object' && 'meta' in error ? { meta: (error as any).meta } : {}),
    })
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check for table/relation not found errors (migration issue)
      if (error.message.includes('does not exist') || 
          error.message.includes('relation') && error.message.includes('does not exist') ||
          error.message.includes('Table') && error.message.includes('doesn\'t exist')) {
        console.error('⚠️ DATABASE MIGRATION ISSUE: Tables may not exist. Run: npx prisma migrate deploy')
        return NextResponse.json(
          { error: 'Database tables not found. Please run database migrations.' },
          { status: 500 }
        )
      }
      
      // Check for connection errors
      if (error.message.includes('Can\'t reach database server') ||
          error.message.includes('Connection') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')) {
        console.error('⚠️ DATABASE CONNECTION ISSUE: Check DATABASE_URL environment variable')
        return NextResponse.json(
          { error: 'Database connection failed. Please check server configuration.' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('Unique constraint') || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Prisma') || error.message.includes('database')) {
        return NextResponse.json(
          { error: 'Database error. Please check the server logs.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
