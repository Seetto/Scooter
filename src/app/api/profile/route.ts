import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function getCurrentUser() {
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id as string | undefined

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      hotelAddress: true,
      rentalDuration: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phoneNumber,
      hotelAddress,
      rentalDuration,
      email,
      currentPassword,
      newPassword,
    } = body

    const dataToUpdate: any = {
      name: name ?? undefined,
      phoneNumber: phoneNumber ?? undefined,
      hotelAddress: hotelAddress ?? undefined,
      rentalDuration: rentalDuration ?? undefined,
      email: email ?? undefined,
    }

    // Handle password change if both current and new passwords are provided
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const existing = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existing || !existing.password) {
        return NextResponse.json(
          { error: 'Unable to update password' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, existing.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      const hashed = await bcrypt.hash(newPassword, 10)
      dataToUpdate.password = hashed
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        hotelAddress: true,
        rentalDuration: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

