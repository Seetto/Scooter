'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '7Zark72502!'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const getAuthHeader = () => {
    const username = adminUsername || ADMIN_USERNAME
    const password = adminPassword || ADMIN_PASSWORD
    const token = typeof window !== 'undefined' ? btoa(`${username}:${password}`) : ''
    return `Basic ${token}`
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users', {
        headers: {
          Authorization: getAuthHeader(),
        },
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError('Invalid admin credentials')
        } else {
          setError(data.error || 'Failed to fetch users')
        }
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        headers: {
          Authorization: getAuthHeader(),
        },
      })
      const data = await response.json()

      if (!response.ok) {
        setAuthError('Invalid admin username or password')
        return
      }

      setIsAuthenticated(true)
      setUsers(data.users || [])
    } catch (err) {
      setAuthError('Failed to authenticate admin')
      console.error('Admin auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!isAuthenticated) return

    const confirmed = window.confirm(`Are you sure you want to delete user "${user.email}"?`)
    if (!confirmed) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: getAuthHeader(),
        },
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete user')
        return
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      setError('An error occurred while deleting the user')
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
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
            Users Database (Admin)
          </h1>
          {isAuthenticated && (
            <button
              onClick={fetchUsers}
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
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#111827',
              }}
            >
              Admin Login
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                marginBottom: '1rem',
              }}
            >
              Enter admin credentials to view and manage users.
            </p>

            {authError && (
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
                {authError}
              </div>
            )}

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="admin-username"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
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
              <label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
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

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#6b7280' }}>Loading users...</p>
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
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#dbeafe',
              borderRadius: '0.375rem',
            }}>
              <strong>Total Users:</strong> {users.length}
            </div>

            {users.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280',
              }}>
                No users found in the database.
              </div>
            ) : (
              <div style={{
                overflowX: 'auto',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f3f4f6',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>ID</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>Email</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>Name</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>Created At</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>Updated At</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          fontFamily: 'monospace',
                        }}>
                          {user.id.substring(0, 8)}...
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: '#374151',
                        }}>
                          {user.email}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: '#374151',
                        }}>
                          {user.name || '-'}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}>
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}>
                          {new Date(user.updatedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
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
  )
}
