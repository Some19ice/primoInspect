import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseDatabase } from '@/lib/supabase/database'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Remove Prisma adapter - using Supabase Auth instead
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // For demo purposes - return a mock user
          // In production, use Supabase Auth instead of NextAuth
          return {
            id: 'demo-user-id',
            email: credentials.email,
            name: 'Demo User',
            role: 'INSPECTOR',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Role-based access control helper
export function hasPermission(
  userRole: string,
  requiredRole: 'executive' | 'project-manager' | 'inspector'
): boolean {
  const roleHierarchy = {
    'project-manager': ['project-manager', 'inspector'],
    executive: ['executive'],
    inspector: ['inspector'],
  }

  return (
    roleHierarchy[userRole as keyof typeof roleHierarchy]?.includes(
      requiredRole
    ) || false
  )
}
