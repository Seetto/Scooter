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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
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
            Users Database
          </h1>
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
        </div>

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

        {!loading && !error && (
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
