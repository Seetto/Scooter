import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth v4 route handler
export default NextAuth(authOptions)
