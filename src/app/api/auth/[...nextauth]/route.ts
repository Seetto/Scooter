import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth v5 beta - use type assertion to handle beta API
const nextAuth = NextAuth as any
const { handlers } = nextAuth(authOptions)

export const { GET, POST } = handlers
