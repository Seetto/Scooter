import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth v5 beta handler
const handler = NextAuth(authOptions) as any

export { handler as GET, handler as POST }
