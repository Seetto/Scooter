'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import AuthLinks from '../components/AuthLinks'

// Load FindScooterButton only on the client to avoid hydration mismatches
const FindScooterButton = dynamic(
  () => import('../components/FindScooterButton'),
  { ssr: false }
)

export default function Home() {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <main style={{
      padding: "2rem",
      textAlign: "center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "2rem",
      background: "var(--bg-main)",
    }}>
      {isAuthenticated && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
        }}>
          <AuthLinks />
        </div>
      )}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          {/* Scooter rider logo image placed directly */}
          <Image
            src="/scooter-rider.png"
            alt="Scooter rider logo"
            width={56}
            height={56}
            style={{ objectFit: 'contain' }}
          />
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            color: "var(--text-primary)"
          }}>
            Scoot2U
          </h1>
        </div>
        <p style={{
          fontSize: "1.125rem",
          color: "var(--text-secondary)",
          marginBottom: "2rem"
        }}>
          Find a scooter near you
        </p>
      </div>
      {isAuthenticated ? (
        <FindScooterButton />
      ) : (
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link
            href="/auth/login"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--accent-secondary-light)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-secondary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-secondary-light)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Sign Up
          </Link>
        </div>
      )}
    </main>
  )
}
