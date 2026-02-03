'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

type BookingTab = 'all' | 'active' | 'completed' | 'cancelled'
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

interface Booking {
  id: string
  userId: string
  storeId: string
  scooterId: string
  startDate: string
  endDate: string
  status: BookingStatus
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    name: string | null
    phoneNumber: string | null
    hotelAddress: string | null
    idDocumentImageUrl: string | null
    damageAgreement: string | null
  }
  store?: {
    id: string
    name: string
    email: string
    phoneNumber: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
  }
  scooter?: {
    id: string
    name: string
    model: string | null
    numberPlate: string | null
  }
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const isStore = (session?.user as any)?.isStore === true
  const [activeTab, setActiveTab] = useState<BookingTab>('all')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [viewingUserInfo, setViewingUserInfo] = useState<string | null>(null) // Booking ID for which we're viewing user info
  const [viewingStoreInfo, setViewingStoreInfo] = useState<string | null>(null) // Booking ID for which we're viewing store info

  const tabs: { id: BookingTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/bookings', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load bookings')
        return
      }

      setBookings(data.bookings || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('An error occurred while loading bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to confirm this booking?')) {
      return
    }

    try {
      setConfirmingId(bookingId)
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to confirm booking')
        return
      }

      // Refresh bookings
      await fetchBookings()
      // Switch to Active tab to show the confirmed booking
      setActiveTab('active')
    } catch (err) {
      console.error('Error confirming booking:', err)
      alert('An error occurred while confirming the booking')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this booking request? This action cannot be undone.')) {
      return
    }

    try {
      setCancellingId(bookingId)
      const response = await fetch(`/api/bookings?id=${encodeURIComponent(bookingId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to cancel booking')
        return
      }

      // Refresh bookings
      await fetchBookings()
    } catch (err) {
      console.error('Error cancelling booking:', err)
      alert('An error occurred while cancelling the booking')
    } finally {
      setCancellingId(null)
    }
  }

  const getFilteredBookings = () => {
    const now = new Date()
    // Set to start of day for accurate date comparison (ignore time component)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return bookings.filter((booking) => {
      const endDate = new Date(booking.endDate)
      // Set to start of day for accurate comparison
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

      switch (activeTab) {
        case 'all':
          return true
        case 'active':
          // Active: confirmed bookings where end date is today or in the future
          return booking.status === 'CONFIRMED' && endDateOnly >= today
        case 'completed':
          // Completed: bookings with COMPLETED status or confirmed bookings where end date has passed (before today)
          return booking.status === 'COMPLETED' || (booking.status === 'CONFIRMED' && endDateOnly < today)
        case 'cancelled':
          return booking.status === 'CANCELLED'
        default:
          return true
      }
    })
  }

  const getTabDescription = (tab: BookingTab) => {
    if (isStore) {
      switch (tab) {
        case 'all':
          return 'All booking requests for your store.'
        case 'active':
          return 'Confirmed and active scooter rentals.'
        case 'completed':
          return 'Completed scooter rentals.'
        case 'cancelled':
          return 'Cancelled booking requests.'
      }
    } else {
      switch (tab) {
        case 'all':
          return 'All of your scooter bookings in one place.'
        case 'active':
          return 'Your current and upcoming scooter hires.'
        case 'completed':
          return 'Completed rides and past bookings.'
        case 'cancelled':
          return 'Any cancelled bookings for your records.'
      }
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
              {isStore ? 'Store Bookings' : 'My Bookings'}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              {isStore
                ? 'View and manage booking requests for your store.'
                : 'View and manage your scooter hire bookings.'}
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

        {/* Tab content */}
        {loading ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.95rem',
            }}
          >
            Loading bookings...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#4b5563',
                marginBottom: '1rem',
              }}
            >
              {getTabDescription(activeTab)}
            </p>
            {getFilteredBookings().length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  border: '1px dashed #d1d5db',
                  backgroundColor: '#f9fafb',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.95rem',
                }}
              >
                No {activeTab} bookings found.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {getFilteredBookings().map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <h3
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: 0,
                            }}
                          >
                            {isStore
                              ? booking.user?.name || booking.user?.email || 'Unknown User'
                              : booking.store?.name || 'Unknown Store'}
                          </h3>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor:
                                booking.status === 'CONFIRMED'
                                  ? '#d1fae5'
                                  : booking.status === 'COMPLETED'
                                    ? '#dbeafe'
                                  : booking.status === 'PENDING'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                              color:
                                booking.status === 'CONFIRMED'
                                  ? '#065f46'
                                  : booking.status === 'COMPLETED'
                                    ? '#1e40af'
                                  : booking.status === 'PENDING'
                                    ? '#92400e'
                                    : '#991b1b',
                            }}
                          >
                            {booking.status}
                          </span>
                        </div>
                        {booking.scooter && (
                          <p
                            style={{
                              fontSize: '0.9rem',
                              color: '#4b5563',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <strong>Scooter:</strong> {booking.scooter.name}
                            {booking.scooter.model && ` (${booking.scooter.model})`}
                            {booking.scooter.numberPlate && ` - ${booking.scooter.numberPlate}`}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: '#4b5563',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <strong>Dates:</strong>{' '}
                          {new Date(booking.startDate).toLocaleDateString()} -{' '}
                          {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            marginTop: '0.5rem',
                          }}
                        >
                          Created: {new Date(booking.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {isStore && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setViewingUserInfo(booking.id)}
                            style={{
                              padding: '0.6rem 1.25rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #2563eb',
                              backgroundColor: '#ffffff',
                              color: '#2563eb',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View User Information
                          </button>
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmBooking(booking.id)}
                                disabled={confirmingId === booking.id || cancellingId === booking.id}
                                style={{
                                  padding: '0.6rem 1.25rem',
                                  borderRadius: '0.5rem',
                                  border: 'none',
                                  backgroundColor: confirmingId === booking.id ? '#9ca3af' : '#10b981',
                                  color: '#ffffff',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  cursor: confirmingId === booking.id || cancellingId === booking.id ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {confirmingId === booking.id ? 'Confirming...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={confirmingId === booking.id || cancellingId === booking.id}
                                style={{
                                  padding: '0.6rem 1.25rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #dc2626',
                                  backgroundColor: cancellingId === booking.id ? '#9ca3af' : '#ffffff',
                                  color: cancellingId === booking.id ? '#ffffff' : '#dc2626',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  cursor: confirmingId === booking.id || cancellingId === booking.id ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {!isStore && booking.store && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setViewingStoreInfo(booking.id)}
                            style={{
                              padding: '0.6rem 1.25rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #2563eb',
                              backgroundColor: '#ffffff',
                              color: '#2563eb',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Store Information
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Information Modal */}
        {viewingUserInfo && isStore && (() => {
          const booking = bookings.find(b => b.id === viewingUserInfo)
          if (!booking || !booking.user) return null
          const user = booking.user
          
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
              }}
              onClick={() => setViewingUserInfo(null)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                    }}
                  >
                    User Information
                  </h2>
                  <button
                    type="button"
                    onClick={() => setViewingUserInfo(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '0.25rem',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Name
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                      }}
                    >
                      {user.name || 'Not provided'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Email
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Phone Number
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                      }}
                    >
                      {user.phoneNumber || 'Not provided'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Hotel / Villa Address
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {user.hotelAddress || 'Not provided'}
                    </div>
                  </div>

                  {user.damageAgreement && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Damage Agreement
                      </label>
                      <div
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#d1fae5',
                          border: '1px solid #10b981',
                          fontSize: '0.95rem',
                          color: '#065f46',
                          fontWeight: 500,
                        }}
                      >
                        ✓ Agreed
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Passport / Driver&apos;s Licence Photo
                    </label>
                    {user.idDocumentImageUrl ? (
                      <div>
                        <img
                          src={user.idDocumentImageUrl}
                          alt="Passport/ID Document"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '2rem',
                          borderRadius: '0.5rem',
                          border: '1px dashed #d1d5db',
                          backgroundColor: '#f9fafb',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontSize: '0.9rem',
                        }}
                      >
                        No passport photo uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewingUserInfo(null)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Store Information Modal */}
        {viewingStoreInfo && !isStore && (() => {
          const booking = bookings.find(b => b.id === viewingStoreInfo)
          if (!booking || !booking.store) return null
          const store = booking.store
          
          const getDirectionsUrl = () => {
            if (store.latitude && store.longitude) {
              return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
            }
            if (store.address) {
              return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
            }
            return null
          }
          
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
              }}
              onClick={() => setViewingStoreInfo(null)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                    }}
                  >
                    Store Information
                  </h2>
                  <button
                    type="button"
                    onClick={() => setViewingStoreInfo(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '0.25rem',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Store Name
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                        fontWeight: 600,
                      }}
                    >
                      {store.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Email
                    </label>
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.95rem',
                        color: '#111827',
                      }}
                    >
                      {store.email}
                    </div>
                  </div>

                  {store.phoneNumber && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Phone Number
                      </label>
                      <div
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.95rem',
                          color: '#111827',
                        }}
                      >
                        {store.phoneNumber}
                      </div>
                    </div>
                  )}

                  {store.address && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Address
                      </label>
                      <div
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.95rem',
                          color: '#111827',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {store.address}
                      </div>
                    </div>
                  )}

                  {store.latitude && store.longitude && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Location
                      </label>
                      <div
                        style={{
                          width: '100%',
                          height: '200px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${store.latitude},${store.longitude}&zoom=15`}
                        />
                      </div>
                      {getDirectionsUrl() && (
                        <button
                          type="button"
                          onClick={() => {
                            const url = getDirectionsUrl()
                            if (url) window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                          style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span role="img" aria-label="map">
                            🗺️
                          </span>
                          Get Directions
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewingStoreInfo(null)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

