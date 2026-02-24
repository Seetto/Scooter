'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

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
    // Require user to enter credentials - no hardcoded fallbacks
    if (!adminUsername || !adminPassword) {
      return ''
    }
    const token = typeof window !== 'undefined' ? btoa(`${adminUsername}:${adminPassword}`) : ''
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
      backgroundColor: 'var(--bg-main)',
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
            color: 'var(--text-primary)',
          }}>
            Users Database (Admin)
          </h1>
          {isAuthenticated && (
            <button
              onClick={fetchUsers}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-primary)',
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
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-main)',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              Admin Login
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
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
                  backgroundColor: 'var(--error-bg)',
                  color: 'var(--error-text)',
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
                  color: 'var(--text-primary)',
                }}
              >
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
                  border: '1px solid var(--border)',
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
                  color: 'var(--text-primary)',
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
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? 'var(--disabled)' : 'var(--accent-primary)',
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
            <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
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
              backgroundColor: 'var(--info-bg)',
              borderRadius: '0.375rem',
            }}>
              <strong>Total Users:</strong> {users.length}
            </div>

            {users.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-secondary)',
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
                      backgroundColor: 'var(--bg-card)',
                      borderBottom: '2px solid var(--border-light)',
                    }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>ID</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>Email</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>Name</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>Created At</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>Updated At</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                        }}
                      >
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                        }}>
                          {user.id.substring(0, 8)}...
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--text-primary)',
                        }}>
                          {user.email}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--text-primary)',
                        }}>
                          {user.name || '-'}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                        }}>
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
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
                              backgroundColor: 'var(--error-text)',
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
