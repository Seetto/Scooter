'use client'

import { useState } from 'react'
import Link from 'next/link'

type BookingTab = 'all' | 'active' | 'completed' | 'cancelled'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('all')

  const tabs: { id: BookingTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  const getTabDescription = (tab: BookingTab) => {
    switch (tab) {
      case 'all':
        return 'In the future this will show all of your scooter bookings in one place.'
      case 'active':
        return 'Here you will see your current and upcoming scooter hires.'
      case 'completed':
        return 'Completed rides and past bookings will appear here.'
      case 'cancelled':
        return 'Any cancelled bookings will be listed here for your records.'
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                color: '#111827',
              }}
            >
              My Bookings
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              View and manage your scooter hire bookings.
            </p>
          </div>
          <Link
            href="/"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              textDecoration: 'none',
              backgroundColor: '#ffffff',
            }}
          >
            ← Back to home
          </Link>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '1.5rem',
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#111827' : 'transparent',
                  color: isActive ? '#f9fafb' : '#4b5563',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content placeholder */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px dashed #d1d5db',
            backgroundColor: '#f9fafb',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#111827',
              textTransform: 'capitalize',
            }}
          >
            {activeTab} bookings
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#4b5563',
              marginBottom: '1rem',
            }}
          >
            {getTabDescription(activeTab)}
          </p>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.95rem',
            }}
          >
            Booking cards will appear here once we connect this page to your scooter hire data.
          </div>
        </div>
      </div>
    </div>
  )
}

