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
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
      }}>
        <AuthLinks />
      </div>
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <FindScooterButton />
        {isAuthenticated && (
          <Link
            href="/bookings"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.025rem',
              fontWeight: 600,
              color: '#1f2937',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
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
            My Bookings
          </Link>
        )}
      </div>
    </main>
  )
}
