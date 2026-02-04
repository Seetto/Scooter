'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Scooter {
  id: string
  name: string
  model: string | null
  numberPlate: string | null
  notes: string | null
  createdAt: string
}

interface PageProps {
  params: Promise<{ storeId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function StoreScootersPage({ params, searchParams }: PageProps) {
  const { storeId } = use(params)
  const resolvedSearchParams = use(searchParams)
  const storeNameParam = resolvedSearchParams.name
  const initialStoreName =
    typeof storeNameParam === 'string'
      ? decodeURIComponent(storeNameParam)
      : 'Store'

  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const [storeName] = useState(initialStoreName)
  const [scooters, setScooters] = useState<Scooter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
  })
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [loadingUnavailableDates, setLoadingUnavailableDates] = useState(false)

  useEffect(() => {
    const fetchScooters = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/stores/${storeId}/scooters`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load scooters for this store.')
          return
        }

        setScooters(data.stores ? data.stores : data.scooters || [])
      } catch (err) {
        console.error('Error loading store scooters:', err)
        setError('An error occurred while loading scooters for this store.')
      } finally {
        setLoading(false)
      }
    }

    fetchScooters()
  }, [storeId])

  const openBookingModal = async (scooter: Scooter) => {
    if (!isAuthenticated) {
      const callbackUrl = window.location.pathname + window.location.search
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(
        callbackUrl,
      )}`
      return
    }

    setSelectedScooter(scooter)
    setBookingError(null)
    setBookingSuccess(null)
    setBookingForm((prev) => ({
      ...prev,
      startDate: '',
      endDate: '',
    }))
    setShowBookingModal(true)

    // Fetch unavailable dates for this scooter
    setLoadingUnavailableDates(true)
    try {
      const unavailableRes = await fetch(`/api/scooters/${scooter.id}/unavailable-dates`)
      if (unavailableRes.ok) {
        const unavailableData = await unavailableRes.json()
        setUnavailableDates(unavailableData.unavailableDates || [])
      }
    } catch (err) {
      console.error('Error loading unavailable dates:', err)
    } finally {
      setLoadingUnavailableDates(false)
    }

    // Load user profile
    try {
      const res = await fetch('/api/profile', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (data.user) {
        setBookingForm((prev) => ({
          ...prev,
          name: data.user.name || '',
          phoneNumber: data.user.phoneNumber || '',
        }))
      }
    } catch (err) {
      console.error('Error loading profile for booking form:', err)
    }
  }

  // Check if a date range conflicts with unavailable dates
  const checkDateConflict = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (end < start) {
      return 'End date must be after start date.'
    }

    // Check if any date in the range is unavailable
    const conflictingDates: string[] = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (unavailableDates.includes(dateStr)) {
        conflictingDates.push(dateStr)
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (conflictingDates.length > 0) {
      const dateList = conflictingDates.slice(0, 5).join(', ')
      const more = conflictingDates.length > 5 ? ` and ${conflictingDates.length - 5} more` : ''
      return `The scooter is not available on: ${dateList}${more}. Please select different dates.`
    }

    return null
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScooter) return

    setBookingError(null)
    setBookingSuccess(null)

    if (!bookingForm.startDate || !bookingForm.endDate) {
      setBookingError('Please select a start and end date for your booking.')
      return
    }

    // Check for date conflicts
    const conflictError = checkDateConflict(bookingForm.startDate, bookingForm.endDate)
    if (conflictError) {
      setBookingError(conflictError)
      return
    }

    setBookingLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          storeId,
          scooterId: selectedScooter.id,
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate,
          name: bookingForm.name,
          phoneNumber: bookingForm.phoneNumber,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Show detailed error message if available
        const errorMsg = data.details 
          ? `${data.error || 'Failed to create booking'}: ${data.details}`
          : data.error || 'Failed to create booking. Please try again.'
        setBookingError(errorMsg)
        setBookingLoading(false)
        console.error('Booking API error:', { status: res.status, data })
        return
      }

      setBookingSuccess(
        'Booking request sent! The store will review and confirm your booking.',
      )
      setBookingLoading(false)
    } catch (err) {
      console.error('Booking error:', err)
      setBookingError('An error occurred while creating the booking. Please try again.')
      setBookingLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '0.25rem',
              }}
            >
              {storeName}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              Scooters available at this store.
            </p>
          </div>

          <Link
            href="/"
            style={{
              padding: '0.7rem 1.3rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.95rem',
            }}
          >
            Loading scooters...
          </div>
        ) : scooters.length === 0 ? (
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '0.5rem',
              border: '1px dashed #d1d5db',
              backgroundColor: '#f9fafb',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.95rem',
            }}
          >
            This store hasn&apos;t listed any scooters yet.
          </div>
        ) : (
          <div
            style={{
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Scooter
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Model
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Number Plate
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Notes
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {scooters.map((scooter) => (
                  <tr
                    key={scooter.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#111827',
                        fontWeight: 600,
                      }}
                    >
                      {scooter.name}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#4b5563',
                      }}
                    >
                      {scooter.model || '-'}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#4b5563',
                        fontFamily: 'monospace',
                      }}
                    >
                      {scooter.numberPlate || '-'}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#4b5563',
                      }}
                    >
                      {scooter.notes || '-'}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openBookingModal(scooter)}
                        style={{
                          padding: '0.45rem 1.1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Book Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedScooter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBookingModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Book Scooter
                </h2>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                  }}
                >
                  {selectedScooter.name} at {storeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
            </div>

            {bookingError && (
              <div
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                }}
              >
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.875rem',
                }}
              >
                {bookingSuccess}
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="booking-name"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Name
                </label>
                <input
                  id="booking-name"
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, name: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="booking-phone"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Phone Number
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  value={bookingForm.phoneNumber}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="+61 4xx xxx xxx"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <label
                    htmlFor="booking-start"
                    style={{
                      display: 'block',
                      marginBottom: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Start Date
                  </label>
                  <input
                    id="booking-start"
                    type="date"
                    value={bookingForm.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setBookingForm({
                        ...bookingForm,
                        startDate: newStartDate,
                        // Reset end date if it's before new start date
                        endDate: bookingForm.endDate && new Date(bookingForm.endDate) < new Date(newStartDate) 
                          ? '' 
                          : bookingForm.endDate,
                      })
                      // Clear error when user changes date
                      if (bookingError) setBookingError(null)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: unavailableDates.includes(bookingForm.startDate) && bookingForm.startDate
                        ? '2px solid #ef4444'
                        : '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      backgroundColor: unavailableDates.includes(bookingForm.startDate) && bookingForm.startDate
                        ? '#fef2f2'
                        : '#ffffff',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="booking-end"
                    style={{
                      display: 'block',
                      marginBottom: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    End Date
                  </label>
                  <input
                    id="booking-end"
                    type="date"
                    value={bookingForm.endDate}
                    min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setBookingForm({
                        ...bookingForm,
                        endDate: e.target.value,
                      })
                      // Clear error when user changes date
                      if (bookingError) setBookingError(null)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: unavailableDates.includes(bookingForm.endDate) && bookingForm.endDate
                        ? '2px solid #ef4444'
                        : '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      backgroundColor: unavailableDates.includes(bookingForm.endDate) && bookingForm.endDate
                        ? '#fef2f2'
                        : '#ffffff',
                    }}
                  />
                </div>
              </div>

              {loadingUnavailableDates ? (
                <div
                  style={{
                    marginBottom: '0.75rem',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                  }}
                >
                  Checking availability...
                </div>
              ) : unavailableDates.length > 0 && (
                <div
                  style={{
                    marginBottom: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#92400e',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ⚠️ Unavailable Dates
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#78350f',
                    }}
                  >
                    This scooter is already booked on {unavailableDates.length} day{unavailableDates.length !== 1 ? 's' : ''}. 
                    These dates are shown in red and cannot be selected.
                  </div>
                </div>
              )}

              {bookingForm.startDate && bookingForm.endDate && (() => {
                const conflict = checkDateConflict(bookingForm.startDate, bookingForm.endDate)
                return conflict ? (
                  <div
                    style={{
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #f87171',
                      fontSize: '0.8rem',
                      color: '#991b1b',
                    }}
                  >
                    {conflict}
                  </div>
                ) : null
              })()}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  disabled={bookingLoading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: bookingLoading ? '#9ca3af' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

