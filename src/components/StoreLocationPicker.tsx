'use client'

import { useState, useEffect, useRef } from 'react'

interface Location {
  lat: number
  lng: number
}

interface StoreLocationPickerProps {
  onLocationSelect: (location: Location, address: string) => void
  initialLocation?: Location | null
}

export default function StoreLocationPicker({ onLocationSelect, initialLocation }: StoreLocationPickerProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null)
  const [address, setAddress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Get user's current location
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationLoading(false)
        },
        (err) => {
          console.warn('Geolocation error:', err)
          setLocationLoading(false)
        }
      )
    } else {
      setLocationLoading(false)
    }
  }, [])

  const getApiKey = () => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const apiKey = getApiKey()
    if (!apiKey) return ''

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address
      }
      return ''
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      return ''
    }
  }

  const loadGoogleMaps = () => {
    const apiKey = getApiKey()
    
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '') {
      setError('Google Maps API key is not configured.')
      return
    }

    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if ((window as any).google && (window as any).google.maps) {
        setMapLoaded(true)
      } else {
        setError('Google Maps failed to load.')
      }
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps.')
    }
    
    document.head.appendChild(script)
  }

  useEffect(() => {
    if (mounted) {
      loadGoogleMaps()
    }
  }, [mounted])

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).google || mapInstanceRef.current) return

    try {
      const google = (window as any).google

      // Use selected location, user location, or default center
      const defaultCenter = selectedLocation || userLocation || { lat: -27.4698, lng: 153.0251 } // Brisbane, Australia as fallback

      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: userLocation && !selectedLocation ? 15 : 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      // Add click listener to map
      map.addListener('click', async (e: any) => {
        const location = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }

        setSelectedLocation(location)

        // Reverse geocode to get address
        const addr = await reverseGeocode(location.lat, location.lng)
        setAddress(addr)
        onLocationSelect(location, addr)

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setPosition(location)
        } else {
          markerRef.current = new google.maps.Marker({
            position: location,
            map: map,
            draggable: true,
            title: 'Store Location',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40),
            },
          })

          // Update location when marker is dragged
          markerRef.current.addListener('dragend', async (e: any) => {
            const draggedLocation = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            }
            setSelectedLocation(draggedLocation)
            const addr = await reverseGeocode(draggedLocation.lat, draggedLocation.lng)
            setAddress(addr)
            onLocationSelect(draggedLocation, addr)
          })
        }
      })

      // If we have an initial location, add marker
      if (selectedLocation) {
        markerRef.current = new google.maps.Marker({
          position: selectedLocation,
          map: map,
          draggable: true,
          title: 'Store Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40),
          },
        })

        markerRef.current.addListener('dragend', async (e: any) => {
          const draggedLocation = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          }
          setSelectedLocation(draggedLocation)
          const addr = await reverseGeocode(draggedLocation.lat, draggedLocation.lng)
          setAddress(addr)
          onLocationSelect(draggedLocation, addr)
        })
      }

      mapInstanceRef.current = map
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map.')
    }
  }, [mapLoaded, selectedLocation, userLocation, onLocationSelect])

  if (!mounted || locationLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280'
      }}>
        {locationLoading ? 'Getting your location...' : 'Loading map...'}
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '0.375rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '0.5rem',
          border: '1px solid #d1d5db',
        }}
      >
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          marginBottom: '0.5rem',
        }}>
          {error}
        </div>
      )}
      {selectedLocation && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#166534',
        }}>
          <strong>Selected Location:</strong> {address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#15803d' }}>
            Click on the map or drag the marker to set your store location
          </div>
        </div>
      )}
      {!selectedLocation && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fef3c7',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#92400e',
        }}>
          Click on the map to set your store location
        </div>
      )}
    </div>
  )
}
