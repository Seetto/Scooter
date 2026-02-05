'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import map component to avoid SSR issues
const StoreMapView = dynamic(() => import('@/components/StoreMapView'), {
  ssr: false,
})

interface Store {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  storeFrontImageUrl: string | null
  accepted: boolean
  createdAt: string
  updatedAt: string
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchStores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getAuthHeader = () => {
    if (!adminUsername || !adminPassword) {
      return ''
    }
    const token = typeof window !== 'undefined' ? btoa(`${adminUsername}:${adminPassword}`) : ''
    return `Basic ${token}`
  }

  const fetchStores = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/stores', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError('Invalid admin credentials')
        } else {
          setError(data.error || 'Failed to fetch stores')
        }
        return
      }

      setStores(data.stores || [])
    } catch (err) {
      setError('An error occurred while fetching stores')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/stores', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        setAuthError('Invalid admin username or password')
        return
      }

      setIsAuthenticated(true)
      setStores(data.stores || [])
    } catch (err) {
      setAuthError('Failed to authenticate admin')
      console.error('Admin auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to accept this store? They will be able to log in after approval.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/stores/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({ storeId }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept store')
        return
      }

      // Update the store in the list
      setStores((prev) =>
        prev.map((store) =>
          store.id === storeId ? { ...store, accepted: true } : store
        )
      )

      // Update selected store if it's the one we just accepted
      if (selectedStore?.id === storeId) {
        setSelectedStore({ ...selectedStore, accepted: true })
      }
    } catch (err) {
      setError('An error occurred while accepting the store')
      console.error('Accept error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStore = async (storeId: string) => {
    const store = stores.find((s) => s.id === storeId)
    const storeName = store?.name || 'this store'
    
    if (!confirm(`⚠️ WARNING: Are you sure you want to delete "${storeName}"?\n\nThis will permanently delete:\n- The store account\n- All scooters belonging to this store\n- All bookings associated with this store\n\nThis action cannot be undone!`)) {
      return
    }

    // Double confirmation for safety
    if (!confirm(`Final confirmation: Delete "${storeName}" and all related data?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: getAuthHeader(),
        },
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete store')
        return
      }

      // Remove the store from the list
      setStores((prev) => prev.filter((store) => store.id !== storeId))

      // Clear selected store if it was the deleted one
      if (selectedStore?.id === storeId) {
        setSelectedStore(null)
      }

      // Show success message
      alert(`Store "${storeName}" has been deleted successfully.\n\nDeleted:\n- Store account\n- ${data.deleted?.scooters || 0} scooter(s)\n- ${data.deleted?.bookings || 0} booking(s)`)
    } catch (err) {
      setError('An error occurred while deleting the store')
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  const pendingStores = stores.filter((s) => !s.accepted)
  const acceptedStores = stores.filter((s) => s.accepted)

  return (
    <div style={{
      minHeight: '100vh',
      padding: '1rem',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
          }}>
            Stores Database (Admin)
          </h1>
          {isAuthenticated && (
            <button
              onClick={fetchStores}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Refresh
            </button>
          )}
        </div>

        {!isAuthenticated && (
          <form
            onSubmit={handleAdminLogin}
            style={{
              maxWidth: '400px',
              marginBottom: '2rem',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#111827',
            }}>
              Admin Login
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#4b5563',
              marginBottom: '1rem',
            }}>
              Enter admin credentials to view and manage stores.
            </p>

            {authError && (
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.875rem',
              }}>
                {authError}
              </div>
            )}

            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="admin-username" style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
              }}>
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="admin-password" style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
              }}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
              }}
            >
              {loading ? 'Checking...' : 'Login as Admin'}
            </button>
          </form>
        )}

        {loading && !isAuthenticated && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#6b7280' }}>Loading stores...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {isAuthenticated && !loading && !error && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.5rem',
                border: '1px solid #fbbf24',
              }}>
                <strong style={{ color: '#92400e' }}>Pending Approval:</strong>{' '}
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e' }}>
                  {pendingStores.length}
                </span>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#d1fae5',
                borderRadius: '0.5rem',
                border: '1px solid #10b981',
              }}>
                <strong style={{ color: '#065f46' }}>Accepted Stores:</strong>{' '}
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#065f46' }}>
                  {acceptedStores.length}
                </span>
              </div>
            </div>

            {stores.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280',
              }}>
                No stores found in the database.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '400px 1fr',
                gap: '2rem',
              }}>
                {/* Store List */}
                <div style={{
                  maxHeight: isMobile ? 'none' : '70vh',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  width: '100%',
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    color: '#1f2937',
                  }}>
                    Store List
                  </h2>
                  {pendingStores.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#92400e',
                        marginBottom: '0.5rem',
                      }}>
                        Pending Approval ({pendingStores.length})
                      </h3>
                      {pendingStores.map((store) => (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStore(store)}
                          style={{
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            backgroundColor: selectedStore?.id === store.id ? '#fef3c7' : '#fff7ed',
                            border: `2px solid ${selectedStore?.id === store.id ? '#f59e0b' : '#fed7aa'}`,
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                            {store.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                            {store.email}
                          </div>
                          {store.phoneNumber && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', wordBreak: 'break-word' }}>
                              {store.phoneNumber}
                            </div>
                          )}
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block',
                          }}>
                            Pending
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {acceptedStores.length > 0 && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#065f46',
                        marginBottom: '0.5rem',
                      }}>
                        Accepted ({acceptedStores.length})
                      </h3>
                      {acceptedStores.map((store) => (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStore(store)}
                          style={{
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            backgroundColor: selectedStore?.id === store.id ? '#d1fae5' : '#f0fdf4',
                            border: `2px solid ${selectedStore?.id === store.id ? '#10b981' : '#86efac'}`,
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                            {store.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                            {store.email}
                          </div>
                          {store.phoneNumber && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', wordBreak: 'break-word' }}>
                              {store.phoneNumber}
                            </div>
                          )}
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block',
                          }}>
                            Accepted
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Store Details */}
                <div style={{ width: '100%', minWidth: 0 }}>
                  {selectedStore ? (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: isMobile ? '1rem' : '1.5rem',
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'flex-start',
                        marginBottom: '1.5rem',
                        gap: '1rem',
                      }}>
                        <div>
                          <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1f2937',
                            marginBottom: '0.5rem',
                          }}>
                            {selectedStore.name}
                          </h2>
                          <div style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: selectedStore.accepted ? '#d1fae5' : '#fef3c7',
                            color: selectedStore.accepted ? '#065f46' : '#92400e',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            display: 'inline-block',
                          }}>
                            {selectedStore.accepted ? '✓ Accepted' : '⏳ Pending Approval'}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.5rem', 
                          flexWrap: 'wrap',
                          width: isMobile ? '100%' : 'auto',
                        }}>
                          {!selectedStore.accepted && (
                            <button
                              onClick={() => handleAcceptStore(selectedStore.id)}
                              disabled={loading}
                              style={{
                                padding: '0.5rem 1.5rem',
                                backgroundColor: loading ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                flex: isMobile ? '1' : 'none',
                                minWidth: isMobile ? '0' : 'auto',
                              }}
                            >
                              {loading ? 'Accepting...' : 'Accept Store'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStore(selectedStore.id)}
                            disabled={loading}
                            style={{
                              padding: '0.5rem 1.5rem',
                              backgroundColor: loading ? '#9ca3af' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              flex: isMobile ? '1' : 'none',
                              minWidth: isMobile ? '0' : 'auto',
                            }}
                          >
                            {loading ? 'Deleting...' : 'Delete Store'}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem', wordBreak: 'break-word' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Email:</strong>
                          <span style={{ color: '#6b7280', wordBreak: 'break-all' }}>{selectedStore.email}</span>
                        </div>
                        {selectedStore.phoneNumber && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Phone:</strong>
                            <span style={{ color: '#6b7280' }}>{selectedStore.phoneNumber}</span>
                          </div>
                        )}
                        {selectedStore.address && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Address:</strong>
                            <span style={{ color: '#6b7280', wordBreak: 'break-word' }}>{selectedStore.address}</span>
                          </div>
                        )}
                        {selectedStore.latitude && selectedStore.longitude && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Location:</strong>
                            <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                              {selectedStore.latitude.toFixed(6)}, {selectedStore.longitude.toFixed(6)}
                            </span>
                          </div>
                        )}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem' }}>Created:</strong>
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {new Date(selectedStore.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Store Location Map */}
                      {selectedStore.latitude && selectedStore.longitude && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: '#1f2937',
                          }}>
                            Store Location
                          </h3>
                          <div style={{ width: '100%', overflow: 'hidden', borderRadius: '0.375rem' }}>
                            <StoreMapView
                              latitude={selectedStore.latitude}
                              longitude={selectedStore.longitude}
                              storeName={selectedStore.name}
                            />
                          </div>
                        </div>
                      )}

                      {/* Store Front Photo Placeholder */}
                      <div>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                          color: '#1f2937',
                        }}>
                          Store Front Photo
                        </h3>
                        {selectedStore.storeFrontImageUrl ? (
                          <img
                            src={selectedStore.storeFrontImageUrl}
                            alt={`${selectedStore.name} store front`}
                            style={{
                              width: '100%',
                              maxWidth: '500px',
                              height: 'auto',
                              borderRadius: '0.375rem',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            maxWidth: '500px',
                            height: '300px',
                            backgroundColor: '#f3f4f6',
                            border: '2px dashed #d1d5db',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af',
                            fontSize: '0.875rem',
                          }}>
                            No store front photo uploaded yet
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '3rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}>
                      Select a store from the list to view details
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
