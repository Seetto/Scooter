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
      gap: "2rem"
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
            color: "#1f2937"
          }}>
            Scoot2U
          </h1>
        </div>
        <p style={{ 
          fontSize: "1.125rem", 
          color: "#6b7280",
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
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
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
              color: '#1f2937',
              backgroundColor: '#e5e7eb',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d1d5db'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb'
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
