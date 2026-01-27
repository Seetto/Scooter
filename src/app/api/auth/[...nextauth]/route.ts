import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// @ts-ignore - NextAuth v5 beta type compatibility
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
