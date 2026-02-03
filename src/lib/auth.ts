import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { verifyAdminCredentials } from './admin-auth'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check for admin login
        if (verifyAdminCredentials(credentials.email, credentials.password)) {
          return {
            id: 'admin',
            email: 'admin@scoot2u.com',
            name: 'Admin',
            isAdmin: true,
          }
        }

        // Check for store login
        const store = await prisma.store.findUnique({
          where: { email: credentials.email }
        })

        if (store && store.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            store.password
          )

          if (isPasswordValid) {
            // Check if store is accepted by admin
            if (!store.accepted) {
              throw new Error('Your store account is pending admin approval. Please wait for approval before logging in.')
            }

            return {
              id: store.id,
              email: store.email,
              name: store.name,
              isAdmin: false,
              isStore: true,
            }
          }
        }

        // Regular user login
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          isAdmin: false,
          isStore: false,
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to home page after successful login
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/`
      }
      // Allow same-origin URLs
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken
      }
      if (token?.sub) {
        session.user.id = token.sub
      }
      if (token?.isAdmin !== undefined) {
        session.user.isAdmin = token.isAdmin
      }
      if (token?.isStore !== undefined) {
        session.user.isStore = token.isStore
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account, user }: { token: any; account: any; user: any }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (user) {
        token.sub = user.id
        token.isAdmin = user.isAdmin || false
        token.isStore = user.isStore || false
      }
      return token
    },
  },
} as const
