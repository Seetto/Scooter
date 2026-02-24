'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const MenuIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
)

const CloseIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
)

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (status === "loading") {
    return (
      <nav style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-soft)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 64 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        </div>
      </nav>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      {/* MINIMAL NAVBAR - ONLY HAMBURGER MENU */}
      <nav style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-soft)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 64 }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ color: 'var(--text-secondary)', padding: 8, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* DROPDOWN - CALENDAR AND NEED TO BOOK LINKS */}
          {isMobileMenuOpen && (
            <div style={{ position: 'absolute', top: 64, left: 0, right: 0, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', zIndex: 50 }}>
              <div style={{ padding: '0.5rem 1rem' }}>
                <Link
                  href="/calendar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: pathname === '/calendar' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: pathname === '/calendar' ? 'var(--accent-secondary-light)' : 'transparent',
                  }}
                >
                  <CalendarIcon />
                  <span>Calendar</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* FIXED FOOTER - USER INFO AND SIGN OUT */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', boxShadow: '0 -2px 10px rgba(0,0,0,0.06)', zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {session.user?.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {session.user?.email}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            style={{
              fontSize: '0.875rem',
              color: 'var(--error-text)',
              padding: '0.5rem 1rem',
              borderRadius: 6,
              border: '1px solid var(--error-bg)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}