'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function AuthLinks() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ color: '#6b7280' }}>Loading...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Link
          href="/profile"
          style={{
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#374151',
            textDecoration: 'none',
            backgroundColor: '#f9fafb',
          }}
        >
          My Profile
        </Link>
        <span style={{ color: '#374151', fontSize: '0.85rem' }}>
          {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link
        href="/auth/login"
        style={{
          padding: '0.5rem 1rem',
          color: '#2563eb',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: '600',
        }}
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '600',
        }}
      >
        Sign Up
      </Link>
    </div>
  )
}
