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
      latitude,
      longitude,
      address,
      storeFrontImageUrl,
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

    if (!name) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      )
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Store location is required. Please select a location on the map.' },
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

    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { email }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create store (not accepted until admin approves)
    const store = await prisma.store.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || null,
        latitude: latitude,
        longitude: longitude,
        address: address || null,
        storeFrontImageUrl: storeFrontImageUrl || null,
        accepted: false, // Requires admin approval
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
      await sendConfirmationEmail(store.email, store.name)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json(
      { 
        message: 'Store account created successfully! Your account is pending admin approval. You will be able to log in once an admin approves your store. Please check your email for confirmation.', 
        store 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Store signup error:', error)
    
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
          { error: 'Store with this email already exists' },
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
