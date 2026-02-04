'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Location {
  lat: number
  lng: number
}

interface Store {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  phoneNumber: string | null
  location: Location // Computed from latitude/longitude
  distance?: number // Distance in kilometers
}

export default function FindScooterButton() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const isStore = (session?.user as any)?.isStore === true
  const [showMap, setShowMap] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [closestStore, setClosestStore] = useState<Store | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Stores will be loaded from the backend in the future.
  // For now, the map only shows the user's location.

  // Ensure component is mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch notification count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const response = await fetch('/api/bookings/notifications', {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            setNotificationCount(data.count || 0)
          }
        } catch (err) {
          console.error('Error fetching notifications:', err)
        }
      }

      fetchNotifications()
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // Check for API key
  const getApiKey = () => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string): Promise<Location | null> => {
    const apiKey = getApiKey()
    if (!apiKey) return null

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  // Calculate distance between two points in kilometers (Haversine formula)
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180
    const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Find closest store
  const findClosestStore = (userLocation: Location, storeList: Store[]): Store | null => {
    if (storeList.length === 0) return null

    let closest: Store | null = null
    let minDistance = Infinity

    storeList.forEach((store) => {
      const distance = calculateDistance(userLocation, store.location)
      store.distance = distance
      if (distance < minDistance) {
        minDistance = distance
        closest = store
      }
    })

    return closest
  }

  // Generate Google Maps directions URL
  const getDirectionsUrl = (destination: Location): string => {
    if (location) {
      // Use user's current location as origin
      return `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${destination.lat},${destination.lng}`
    }
    // Fallback to destination only (will use current location)
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`
  }

  const loadGoogleMaps = () => {
    const apiKey = getApiKey()
    
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '') {
      setError(
        'Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file. See README.md for setup instructions.'
      )
      setLoading(false)
      return
    }

    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true)
      return
    }

    // Add global error handler for Google Maps
    ;(window as any).gm_authFailure = () => {
      setError(
        'Invalid Google Maps API key. Please check your API key in .env.local and ensure the Maps JavaScript API is enabled in Google Cloud Console.'
      )
      setMapLoaded(false)
      setLoading(false)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      // Check if Google Maps loaded successfully
      if ((window as any).google && (window as any).google.maps) {
        setMapLoaded(true)
      } else {
        setError('Google Maps failed to load. Please check your API key.')
        setLoading(false)
      }
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and internet connection.')
      setLoading(false)
    }
    
    document.head.appendChild(script)
  }

  // Fetch accepted stores from the API
  const fetchAcceptedStores = async (): Promise<Store[]> => {
    try {
      const response = await fetch('/api/stores/public')
      const data = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch stores:', data.error)
        return []
      }

      // Transform API response to Store format
      return (data.stores || []).map((store: any) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        phoneNumber: store.phoneNumber,
        location: {
          lat: store.latitude,
          lng: store.longitude,
        },
      }))
    } catch (err) {
      console.error('Error fetching stores:', err)
      return []
    }
  }

  const handleFindScooter = async () => {
    setLoading(true)
    setError(null)

    // Check for API key first
    const apiKey = getApiKey()
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '') {
      setError(
        'Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.'
      )
      setLoading(false)
      return
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(userLocation)

        // Fetch accepted stores from the backend
        const acceptedStores = await fetchAcceptedStores()
        setStores(acceptedStores)

        // Find closest store if we have stores
        if (acceptedStores.length > 0) {
          const closest = findClosestStore(userLocation, acceptedStores)
          setClosestStore(closest)
          setSelectedStore(closest) // Auto-select closest store
        } else {
          setClosestStore(null)
          setSelectedStore(null)
        }

        setShowMap(true)
        loadGoogleMaps()
        setLoading(false)
      },
      (err) => {
        setError('Unable to retrieve your location. Please enable location services.')
        setLoading(false)
        console.error('Geolocation error:', err)
      }
    )
  }

  // Initialize map when both location and Google Maps are ready
  useEffect(() => {
    if (!showMap || !location || !mapLoaded || !(window as any).google || !mapRef.current) return

    // Clear previous map instance to allow re-initialization with new stores
    if (mapInstanceRef.current) {
      // Clear previous markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      mapInstanceRef.current = null
    }

    try {
      const google = (window as any).google

      // Calculate bounds to fit both user location and stores
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(location)

      if (stores.length > 0) {
        stores.forEach((store) => {
          bounds.extend(store.location)
        })
      } else {
        // If no stores, just center on user location
        bounds.extend(location)
      }

      const map = new google.maps.Map(mapRef.current, {
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      // Fit bounds to show all markers (or center on user if no stores)
      if (stores.length > 0) {
        map.fitBounds(bounds)
        // Add padding to bounds
        const padding = 50
        map.fitBounds(bounds, padding)
      } else {
        map.setCenter(location)
        map.setZoom(15)
      }

      // Add user location marker
      new google.maps.Marker({
        position: location,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      })

      // Clear previous markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []

      // Add store markers
      stores.forEach((store) => {
        const isClosest = closestStore?.id === store.id

        // Create marker with different icon for closest store
        const marker = new google.maps.Marker({
          position: store.location,
          map: map,
          title: store.name,
          icon: {
            url: isClosest
              ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
              : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32),
          },
        })

        // Create very compact info window with just store name and distance
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 0.2rem 0.35rem; line-height: 1.2; white-space: nowrap;">
              <div style="font-size: 0.75rem; font-weight: 600; color: #1f2937;">${store.name}</div>
              ${store.distance ? `<div style="color: #059669; font-size: 0.65rem; margin-top: 0.1rem;">${store.distance.toFixed(2)} km</div>` : ''}
            </div>
          `,
        })

        marker.addListener('click', () => {
          setSelectedStore(store)
          setExpandedStoreId(store.id === expandedStoreId ? null : store.id) // Toggle expansion
          infoWindow.open(map, marker)
        })

        // Show info window for closest store automatically
        if (isClosest) {
          infoWindow.open(map, marker)
        }

        markersRef.current.push(marker)
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map. Please check your API key.')
      setMapLoaded(false)
    }
  }, [showMap, location, mapLoaded, stores, closestStore])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          disabled={true}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#fff',
            backgroundColor: '#9ca3af',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'not-allowed',
          }}
        >
          Find Scooter
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={handleFindScooter}
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#fff',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading && mounted) {
              e.currentTarget.style.backgroundColor = '#1d4ed8'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && mounted) {
              e.currentTarget.style.backgroundColor = '#2563eb'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }
          }}
        >
          {loading ? 'Finding Location...' : 'Find Scooter'}
        </button>

        {isAuthenticated && (
          <Link
            href="/bookings"
            style={{
              position: 'relative',
              padding: '0.9rem 1.75rem',
              fontSize: '1rem',
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
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  minWidth: '1.25rem',
                  height: '1.25rem',
                  padding: '0 0.35rem',
                  borderRadius: '9999px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>
        )}

        {isStore && (
          <Link
            href="/scooters"
            style={{
              padding: '0.9rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1f2937',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
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
            My Scooters
          </Link>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            maxWidth: '500px',
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          <strong>Error:</strong> {error}
          {error.includes('API key') && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#991b1b', textDecoration: 'underline' }}
              >
                Get your API key here
              </a>
            </div>
          )}
        </div>
      )}

      {/* Store List */}
      {showMap && stores.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {stores.map((store) => {
            const isExpanded = expandedStoreId === store.id
            return (
              <div
                key={store.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                      {store.name}
                    </div>
                    {store.distance !== undefined && (
                      <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.2rem' }}>
                        Distance: {store.distance.toFixed(2)} km
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedStoreId(isExpanded ? null : store.id)
                      setSelectedStore(store)
                    }}
                    style={{
                      padding: '0.6rem 1.25rem',
                      backgroundColor: isExpanded ? '#e5e7eb' : '#2563eb',
                      color: isExpanded ? '#374151' : '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = '#1d4ed8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = '#2563eb'
                      }
                    }}
                  >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Store Details */}
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#374151' }}>Address:</strong>{' '}
                        {store.address || 'No address provided'}
                      </div>
                      {store.phoneNumber && (
                        <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                          <strong style={{ color: '#374151' }}>Phone:</strong> {store.phoneNumber}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const url = getDirectionsUrl(store.location)
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                        style={{
                          padding: '0.6rem 1.25rem',
                          backgroundColor: '#6b7280',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4b5563'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#6b7280'
                        }}
                      >
                        <span role="img" aria-label="map">
                          🗺️
                        </span>
                        Get Directions
                      </button>
                      <Link
                        href={`/stores/${store.id}/scooters?name=${encodeURIComponent(store.name)}`}
                        style={{
                          padding: '0.6rem 1.25rem',
                          backgroundColor: '#6b7280',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4b5563'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#6b7280'
                        }}
                      >
                        <span role="img" aria-label="scooter">
                          🛵
                        </span>
                        View Scooters
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showMap && !error && (
        <div
          style={{
            width: 'min(100vw - 4rem, 1100px)', // use almost full viewport width, with padding
            height: 'min(70vh, 700px)',         // responsive height based on viewport
            minHeight: '320px',                 // keep usable height on small phones
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            marginTop: '1rem',
          }}
        >
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}
