import { authOptions } from '@/lib/auth'
import NextAuth from 'next-auth'

// NextAuth v5 beta uses a different export pattern
export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)

export const { GET, POST } = handlers
