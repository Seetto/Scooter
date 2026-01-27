'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import AuthLinks from '../components/AuthLinks'

// Load FindScooterButton only on the client to avoid hydration mismatches
const FindScooterButton = dynamic(
  () => import('../components/FindScooterButton'),
  { ssr: false }
)

export default function Home() {
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
      <FindScooterButton />
    </main>
  )
}
