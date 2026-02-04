'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

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

export default function AuthLinks() {
  const { data: session, status } = useSession()
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showStoresModal, setShowStoresModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  const isAdmin = (session?.user as any)?.isAdmin === true
  const isStore = (session?.user as any)?.isStore === true

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch users')
        return
      }

      setUsers(data.users || [])
    } catch (err) {
      setError('An error occurred while fetching users')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
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
        setError(data.error || 'Failed to fetch stores')
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

  useEffect(() => {
    if (showUsersModal && users.length === 0) {
      fetchUsers()
    }
  }, [showUsersModal])

  useEffect(() => {
    if (showStoresModal && stores.length === 0) {
      fetchStores()
    }
  }, [showStoresModal])

  // Fetch notification count
  useEffect(() => {
    if (status === 'authenticated') {
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
  }, [status])

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
    } catch (err) {
      setError('An error occurred while accepting the store')
      console.error('Accept error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOnMaps = (store: Store) => {
    if (store.latitude && store.longitude) {
      const url = `https://www.google.com/maps?q=${store.latitude},${store.longitude}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (store.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ color: '#6b7280' }}>Loading...</span>
      </div>
    )
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (session) {
    return (
      <>
        {/* Hamburger Menu Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
            }}
            aria-label="Open menu"
          >
            <span
              style={{
                width: '1.25rem',
                height: '2px',
                backgroundColor: '#374151',
                borderRadius: '1px',
                transition: 'all 0.3s ease',
                transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
              }}
            />
            <span
              style={{
                width: '1.25rem',
                height: '2px',
                backgroundColor: '#374151',
                borderRadius: '1px',
                transition: 'all 0.3s ease',
                opacity: isMenuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                width: '1.25rem',
                height: '2px',
                backgroundColor: '#374151',
                borderRadius: '1px',
                transition: 'all 0.3s ease',
                transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998,
                }}
                onClick={() => setIsMenuOpen(false)}
              />
              {/* Menu Dropdown */}
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  minWidth: '200px',
                  zIndex: 999,
                  padding: '0.5rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e7eb',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                    {session.user?.name || session.user?.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {session.user?.email}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setShowUsersModal(true)
                          if (users.length === 0) fetchUsers()
                          setIsMenuOpen(false)
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#374151',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        View Users
                      </button>
                      <button
                        onClick={() => {
                          setShowStoresModal(true)
                          if (stores.length === 0) fetchStores()
                          setIsMenuOpen(false)
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#374151',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        View Stores
                      </button>
                      <div
                        style={{
                          height: '1px',
                          backgroundColor: '#e5e7eb',
                          margin: '0.5rem 0',
                        }}
                      />
                    </>
                  )}
                  <Link
                    href="/bookings"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      position: 'relative',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      textDecoration: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    My Bookings
                    {notificationCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '1rem',
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
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      textDecoration: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    My Profile
                  </Link>
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: '#e5e7eb',
                      margin: '0.5rem 0',
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Users Modal */}
        {showUsersModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowUsersModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Users</h2>
                <button
                  onClick={() => setShowUsersModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  ×
                </button>
              </div>
              {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
              {error && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              {!loading && !error && (
                <>
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.375rem' }}>
                    <strong>Total Users:</strong> {users.length}
                  </div>
                  {users.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No users found.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Name</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem', color: '#374151' }}>{user.email}</td>
                              <td style={{ padding: '0.75rem', color: '#374151' }}>{user.name || '-'}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Stores Modal */}
        {showStoresModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowStoresModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Stores</h2>
                <button
                  onClick={() => setShowStoresModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  ×
                </button>
              </div>
              {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
              {error && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              {!loading && !error && (
                <>
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.375rem' }}>
                    <strong>Total Stores:</strong> {stores.length} ({stores.filter(s => s.accepted).length} accepted, {stores.filter(s => !s.accepted).length} pending)
                  </div>
                  {stores.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No stores found.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Name</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Address</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Created</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stores.map((store) => (
                            <tr key={store.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem', color: '#374151', fontWeight: 600 }}>{store.name}</td>
                              <td style={{ padding: '0.75rem', color: '#374151', fontSize: '0.875rem' }}>{store.email}</td>
                              <td style={{ padding: '0.75rem', color: '#374151', fontSize: '0.875rem' }}>{store.address || '-'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: store.accepted ? '#d1fae5' : '#fef3c7',
                                  color: store.accepted ? '#065f46' : '#92400e',
                                }}>
                                  {store.accepted ? 'Accepted' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {new Date(store.createdAt).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {(store.latitude && store.longitude) || store.address ? (
                                    <button
                                      onClick={() => handleViewOnMaps(store)}
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #2563eb',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      View on Maps
                                    </button>
                                  ) : null}
                                  {!store.accepted && (
                                    <button
                                      onClick={() => handleAcceptStore(store.id)}
                                      disabled={loading}
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        backgroundColor: loading ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      Accept
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link
        href="/auth/login"
        style={{
          padding: '0.5rem 1rem',
          color: '#2563eb',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: '600',
        }}
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '600',
        }}
      >
        Sign Up
      </Link>
    </div>
  )
}
