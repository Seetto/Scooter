'use client'

import { useEffect, useRef, useState } from 'react'

interface StoreMapViewProps {
  latitude: number
  longitude: number
  storeName: string
}

export default function StoreMapView({ latitude, longitude, storeName }: StoreMapViewProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getApiKey = () => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }

  const loadGoogleMaps = () => {
    const apiKey = getApiKey()
    
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '') {
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
      }
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

      const location = { lat: latitude, lng: longitude }

      const map = new google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      // Add marker
      new google.maps.Marker({
        position: location,
        map: map,
        title: storeName,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(40, 40),
        },
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.error('Error initializing map:', err)
    }
  }, [mapLoaded, latitude, longitude, storeName])

  if (!mounted) {
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
        Loading map...
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #d1d5db',
      }}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
