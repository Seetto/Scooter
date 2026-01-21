'use client'

import { useState } from 'react'

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

  const loadGoogleMaps = () => {
    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapLoaded(true)
    script.onerror = () => setError('Failed to load Google Maps')
    document.head.appendChild(script)
  }

  const handleFindScooter = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
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

  const initMap = () => {
    if (!location || !mapLoaded || !(window as any).google) return

    const mapElement = document.getElementById('map')
    if (!mapElement) return

    const google = (window as any).google
    const map = new google.maps.Map(mapElement, {
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
  }

  // Initialize map when both location and Google Maps are ready
  if (showMap && location && mapLoaded) {
    setTimeout(initMap, 100)
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
          if (!loading) {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
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
            padding: '0.75rem 1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {showMap && (
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
          <div id="map" style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}

