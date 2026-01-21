'use client'

import { useState, useEffect, useRef } from 'react'

interface Location {
  lat: number
  lng: number
}

export default function FindScooterButton() {
  const [showMap, setShowMap] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Ensure component is mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for API key
  const getApiKey = () => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
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

  const handleFindScooter = () => {
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
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(userLocation)
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

    // Prevent re-initialization
    if (mapInstanceRef.current) return

    try {
      const google = (window as any).google
      const map = new google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      new google.maps.Marker({
        position: location,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map. Please check your API key.')
      setMapLoaded(false)
    }
  }, [showMap, location, mapLoaded])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <button
          disabled
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
      <button
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

      {showMap && !error && (
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            height: '500px',
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
