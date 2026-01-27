import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

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
    
    console.error('Error details:', {
      message: errorMessage,
      name: errorName,
    })
    
    // Provide more specific error messages
    if (error instanceof Error) {
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
