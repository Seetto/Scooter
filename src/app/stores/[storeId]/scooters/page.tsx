'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Scooter {
  id: string
  name: string
  model: string | null
  numberPlate: string | null
  availableUnits: number
  pricePerDay: number | null
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED'
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
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({})
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    quantity: 1,
  })
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [loadingUnavailableDates, setLoadingUnavailableDates] = useState(false)
  const [rentalPeriod, setRentalPeriod] = useState({
    startDate: '',
    endDate: '',
  })
  const [scooterAvailability, setScooterAvailability] = useState<Record<string, boolean>>({})
  const [checkingAvailability, setCheckingAvailability] = useState(false)

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

  // Check availability for all scooters when rental period changes
  useEffect(() => {
    const checkScooterAvailability = async () => {
      if (!rentalPeriod.startDate || !rentalPeriod.endDate) {
        // Reset availability if dates are cleared
        setScooterAvailability({})
        return
      }

      setCheckingAvailability(true)
      const availability: Record<string, boolean> = {}

      const start = new Date(rentalPeriod.startDate)
      const end = new Date(rentalPeriod.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      // Check each scooter's availability (both AVAILABLE and RENTED scooters)
      for (const scooter of scooters) {
        try {
          // For RENTED scooters, check if the selected dates are after their booking end date
          if (scooter.status === 'RENTED') {
            // Use unavailable-dates API but also check all bookings to see if they overlap
            const response = await fetch(`/api/scooters/${scooter.id}/unavailable-dates`)
            if (response.ok) {
              const data = await response.json()
              const bookings = data.bookings || []
              
              // Also check unavailable dates to see if any date in the selected range is unavailable
              const unavailableDates = data.unavailableDates || []
              const hasUnavailableDates = unavailableDates.some((dateStr: string) => {
                const date = new Date(dateStr)
                date.setHours(0, 0, 0, 0)
                return date >= start && date <= end
              })
              
              // Check if there are any active bookings that overlap with the selected dates
              // A booking ending on Feb 6 means the scooter is available starting Feb 7
              const hasOverlappingBooking = bookings.some((booking: any) => {
                const bookingStart = new Date(booking.startDate)
                const bookingEnd = new Date(booking.endDate)
                bookingStart.setHours(0, 0, 0, 0)
                bookingEnd.setHours(0, 0, 0, 0)
                
                // Overlap occurs if the selected range intersects with the booking range
                // Overlap if: selected start <= booking end AND selected end >= booking start
                return (start <= bookingEnd && end >= bookingStart)
              })
              
              // If no overlapping bookings and no unavailable dates in the range, the scooter is available
              availability[scooter.id] = !hasOverlappingBooking && !hasUnavailableDates
            } else {
              // If we can't check, assume not available for RENTED scooters
              availability[scooter.id] = false
            }
          } else {
            // For AVAILABLE scooters, check for date conflicts
            const response = await fetch(`/api/scooters/${scooter.id}/unavailable-dates`)
            if (response.ok) {
              const data = await response.json()
              const unavailableDates = data.unavailableDates || []

              // Check if any date in the rental period is unavailable
              let isAvailable = true

              const currentDate = new Date(start)
              while (currentDate <= end && isAvailable) {
                const dateStr = currentDate.toISOString().split('T')[0]
                if (unavailableDates.includes(dateStr)) {
                  isAvailable = false
                }
                currentDate.setDate(currentDate.getDate() + 1)
              }

              availability[scooter.id] = isAvailable
            } else {
              // If we can't check, assume available
              availability[scooter.id] = true
            }
          }
        } catch (err) {
          console.error(`Error checking availability for scooter ${scooter.id}:`, err)
          // On error, assume not available for RENTED, available for others
          availability[scooter.id] = scooter.status !== 'RENTED'
        }
      }

      setScooterAvailability(availability)
      setCheckingAvailability(false)
    }

    checkScooterAvailability()
  }, [rentalPeriod.startDate, rentalPeriod.endDate, scooters])

  const openBookingModal = async (scooter: Scooter, prefillDates?: { startDate: string; endDate: string }, quantity?: number) => {
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
    
    // Calculate available units for this model based on selected dates
    const modelScooters = scooters.filter(s => 
      (s.model || s.name) === (scooter.model || scooter.name)
    )
    let availableUnitsForModal = 0
    if (prefillDates?.startDate && prefillDates?.endDate) {
      // Count AVAILABLE scooters that are available for the selected dates
      const availableScooters = modelScooters.filter(s => s.status === 'AVAILABLE')
      availableUnitsForModal += availableScooters.filter(s => 
        scooterAvailability[s.id] !== false && scooterAvailability[s.id] !== undefined
      ).length
      
      // Count RENTED scooters that are available for the selected dates (booking has ended)
      const rentedScooters = modelScooters.filter(s => s.status === 'RENTED')
      availableUnitsForModal += rentedScooters.filter(s => 
        scooterAvailability[s.id] === true
      ).length
    } else {
      // If no dates selected, only count AVAILABLE scooters
      availableUnitsForModal = modelScooters.filter(s => s.status === 'AVAILABLE').length
    }
    
    // Update the scooter object with the calculated available units
    const scooterWithAvailableUnits = {
      ...scooter,
      availableUnits: availableUnitsForModal || 1, // Default to 1 if calculation fails
    }
    setSelectedScooter(scooterWithAvailableUnits)
    
    const qty = quantity || selectedQuantity[scooter.id] || 1
    setBookingForm((prev) => ({
      ...prev,
      startDate: prefillDates?.startDate || '',
      endDate: prefillDates?.endDate || '',
      quantity: Math.min(qty, availableUnitsForModal || 1), // Ensure quantity doesn't exceed available units
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

    // Parse dates consistently - use the date string directly to avoid timezone issues
    const startParts = startDate.split('-')
    const endParts = endDate.split('-')
    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]))
    const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]))
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (end < start) {
      return 'End date must be after start date.'
    }

    // Check if any date in the selected range is unavailable
    // Note: unavailableDates are in YYYY-MM-DD format
    const conflictingDates: string[] = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      // Format as YYYY-MM-DD to match unavailableDates format
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // Only check dates that are actually in the selected range
      // A booking ending on Feb 6 means Feb 7+ should be available
      // So we should only flag conflicts for dates >= start date
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

    // Calculate available units for the selected dates
    const modelScooters = scooters.filter(s => 
      (s.model || s.name) === (selectedScooter.model || selectedScooter.name)
    )
    const availableScootersForDates = modelScooters.filter(s => {
      if (s.status === 'AVAILABLE') {
        return scooterAvailability[s.id] !== false && scooterAvailability[s.id] !== undefined
      } else if (s.status === 'RENTED') {
        return scooterAvailability[s.id] === true
      }
      return false
    })
    const maxAvailableUnits = availableScootersForDates.length

    if (!bookingForm.quantity || bookingForm.quantity < 1 || bookingForm.quantity > maxAvailableUnits) {
      setBookingError(`Please select a quantity between 1 and ${maxAvailableUnits}.`)
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
      // Create all bookings in a single request
      const response = await fetch('/api/bookings', {
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
          quantity: bookingForm.quantity,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.details 
          ? `${result.error || 'Failed to create booking'}: ${result.details}`
          : result.error || 'Failed to create booking. Please try again.'
        setBookingError(errorMsg)
        setBookingLoading(false)
        return
      }

      const successCount = result.quantity || bookingForm.quantity
      setBookingSuccess(
        `Successfully created ${successCount} booking${successCount > 1 ? 's' : ''}! The store will review and confirm your booking${successCount > 1 ? 's' : ''}.`,
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

        {/* Rental Period Selector */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.75rem',
            }}
          >
            Select Rental Period
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div>
              <label
                htmlFor="rental-start"
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
                id="rental-start"
                type="date"
                value={rentalPeriod.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setRentalPeriod({
                    ...rentalPeriod,
                    startDate: e.target.value,
                    // Reset end date if it's before new start date
                    endDate: rentalPeriod.endDate && new Date(rentalPeriod.endDate) < new Date(e.target.value)
                      ? ''
                      : rentalPeriod.endDate,
                  })
                }}
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
            <div>
              <label
                htmlFor="rental-end"
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
                id="rental-end"
                type="date"
                value={rentalPeriod.endDate}
                min={rentalPeriod.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setRentalPeriod({
                    ...rentalPeriod,
                    endDate: e.target.value,
                  })
                }}
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
          </div>
          {checkingAvailability && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              Checking availability...
            </div>
          )}
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
                    Available Units
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
                    Price per Day
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
                    Quantity
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
                {(() => {
                  // Group scooters by model and calculate available units for each
                  const modelGroups: Record<string, Scooter[]> = {}
                  scooters.forEach((scooter) => {
                    const model = scooter.model || scooter.name || 'Unknown'
                    if (!modelGroups[model]) {
                      modelGroups[model] = []
                    }
                    modelGroups[model].push(scooter)
                  })

                  // Get unique models (one row per model)
                  const uniqueModels = Object.keys(modelGroups)
                  
                  return uniqueModels.map((model) => {
                    const modelScooters = modelGroups[model]
                    const availableScooters = modelScooters.filter(s => s.status === 'AVAILABLE')
                    const rentedScooters = modelScooters.filter(s => s.status === 'RENTED')
                    
                    // Calculate available units for the selected dates
                    // Include AVAILABLE scooters that don't have date conflicts
                    // Include RENTED scooters whose bookings have ended before the selected dates
                    let availableUnitsForDates = 0
                    if (rentalPeriod.startDate && rentalPeriod.endDate) {
                      // Count AVAILABLE scooters that are available for the selected dates
                      availableUnitsForDates += availableScooters.filter(s => 
                        scooterAvailability[s.id] !== false && scooterAvailability[s.id] !== undefined
                      ).length
                      
                      // Count RENTED scooters that are available for the selected dates (booking has ended)
                      availableUnitsForDates += rentedScooters.filter(s => 
                        scooterAvailability[s.id] === true
                      ).length
                    } else {
                      // If no dates selected, only count AVAILABLE scooters
                      availableUnitsForDates = availableScooters.length
                    }
                    
                    const totalUnits = modelScooters.length
                    
                    // Use the first scooter of this model for display
                    const scooter = modelScooters[0]
                    
                    // Determine if any scooter of this model is available for the selected dates
                    const isAvailable = rentalPeriod.startDate && rentalPeriod.endDate
                      ? availableUnitsForDates > 0
                      : availableScooters.length > 0
                    const availabilityChecked = rentalPeriod.startDate && rentalPeriod.endDate
                      ? modelScooters.every(s => scooterAvailability[s.id] !== undefined)
                      : true
                    
                    // If all scooters are RENTED and none are available for the selected dates
                    const allRented = availableScooters.length === 0 && rentedScooters.length > 0 && availableUnitsForDates === 0

                    return (
                    <tr
                      key={scooter.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        opacity: rentalPeriod.startDate && rentalPeriod.endDate && !isAvailable ? 0.6 : 1,
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
                        {scooter.model || scooter.name || '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#4b5563',
                        }}
                      >
                        {rentalPeriod.startDate && rentalPeriod.endDate 
                          ? availableUnitsForDates 
                          : availableScooters.length}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#4b5563',
                          fontWeight: 600,
                        }}
                      >
                        {scooter.pricePerDay ? `Rp ${scooter.pricePerDay.toLocaleString('id-ID')} (IDR)` : '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                        }}
                      >
                        <select
                          value={selectedQuantity[scooter.id] || 1}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value)
                            setSelectedQuantity((prev) => ({
                              ...prev,
                              [scooter.id]: qty,
                            }))
                          }}
                          disabled={!isAvailable || !availabilityChecked}
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #d1d5db',
                            fontSize: '0.85rem',
                            backgroundColor: (!isAvailable || !availabilityChecked) ? '#f3f4f6' : 'white',
                            color: (!isAvailable || !availabilityChecked) ? '#9ca3af' : '#111827',
                            cursor: (!isAvailable || !availabilityChecked) ? 'not-allowed' : 'pointer',
                            minWidth: '60px',
                          }}
                        >
                          {Array.from({ length: rentalPeriod.startDate && rentalPeriod.endDate 
                            ? availableUnitsForDates 
                            : availableScooters.length }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                        }}
                      >
                        {!rentalPeriod.startDate || !rentalPeriod.endDate ? (
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: '#9ca3af',
                              fontStyle: 'italic',
                            }}
                          >
                            Please select a date range
                          </span>
                        ) : !availabilityChecked ? (
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: '#6b7280',
                              fontStyle: 'italic',
                            }}
                          >
                            Checking...
                          </span>
                        ) : allRented || !isAvailable ? (
                          <span
                            style={{
                              padding: '0.45rem 1.1rem',
                              borderRadius: '0.5rem',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              display: 'inline-block',
                            }}
                          >
                            Not Available
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Use the first available scooter for booking
                              const scooterToBook = availableScooters[0] || scooter
                              openBookingModal(scooterToBook, {
                                startDate: rentalPeriod.startDate,
                                endDate: rentalPeriod.endDate,
                              }, selectedQuantity[scooter.id] || 1)
                            }}
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
                        )}
                      </td>
                    </tr>
                    )
                  })
                })()}
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
                  {selectedScooter.model || selectedScooter.name} at {storeName}
                </p>
                {selectedScooter.pricePerDay && bookingForm.startDate && bookingForm.endDate && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Quantity: {bookingForm.quantity} × Rp {selectedScooter.pricePerDay.toLocaleString('id-ID')} (IDR)/day
                    </div>
                    {(() => {
                      const start = new Date(bookingForm.startDate)
                      const end = new Date(bookingForm.endDate)
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      const totalPrice = selectedScooter.pricePerDay * days * bookingForm.quantity
                      return (
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                          Total: Rp {totalPrice.toLocaleString('id-ID')} (IDR) ({days} day{days !== 1 ? 's' : ''})
                        </div>
                      )
                    })()}
                  </div>
                )}
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

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="booking-quantity"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Quantity
                </label>
                <select
                  id="booking-quantity"
                  value={bookingForm.quantity}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, quantity: parseInt(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                  }}
                >
                  {selectedScooter && Array.from({ length: selectedScooter.availableUnits }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
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
              ) : (() => {
                // Only show warning if selected dates conflict with unavailable dates
                if (!bookingForm.startDate || !bookingForm.endDate || unavailableDates.length === 0) {
                  return null
                }
                
                // Parse dates using local time to avoid timezone issues
                const startParts = bookingForm.startDate.split('-')
                const endParts = bookingForm.endDate.split('-')
                const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]))
                const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]))
                start.setHours(0, 0, 0, 0)
                end.setHours(0, 0, 0, 0)
                
                // Check which dates in the selected range are unavailable
                const conflictingDates: string[] = []
                const currentDate = new Date(start)
                while (currentDate <= end) {
                  // Format as YYYY-MM-DD using local date components
                  const year = currentDate.getFullYear()
                  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
                  const day = String(currentDate.getDate()).padStart(2, '0')
                  const dateStr = `${year}-${month}-${day}`
                  
                  if (unavailableDates.includes(dateStr)) {
                    conflictingDates.push(dateStr)
                  }
                  currentDate.setDate(currentDate.getDate() + 1)
                }
                
                // Only show warning if there are actual conflicts
                if (conflictingDates.length === 0) {
                  return null
                }
                
                return (
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
                      This scooter is already booked on {conflictingDates.length} day{conflictingDates.length !== 1 ? 's' : ''} in your selected range. 
                      These dates are shown in red and cannot be selected.
                    </div>
                  </div>
                )
              })()}

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

