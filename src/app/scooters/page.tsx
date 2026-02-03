'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Scooter {
  id: string
  name: string
  model: string
  numberPlate: string
  notes: string
  createdAt: string
}

export default function ScootersPage() {
  const { data: session, status } = useSession()
  const [scooters, setScooters] = useState<Scooter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    model: '',
    numberPlate: '',
    notes: '',
  })

  const isLoadingSession = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isStore = (session?.user as any)?.isStore === true

  // Load scooters for this store from the backend
  useEffect(() => {
    const fetchScooters = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/scooters', {
          credentials: 'include',
        })
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load scooters')
          return
        }

        setScooters(data.scooters || [])
      } catch (err) {
        console.error('Error loading scooters:', err)
        setError('An error occurred while loading your scooters.')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && isStore) {
      fetchScooters()
    }
  }, [isAuthenticated, isStore])

  const handleAddScooter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/scooters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          model: form.model,
          numberPlate: form.numberPlate,
          notes: form.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save scooter')
        return
      }

      const newScooter = data.scooter as Scooter
      setScooters((prev) => [newScooter, ...prev])
      setForm({ name: '', model: '', numberPlate: '', notes: '' })
      setShowForm(false)
    } catch (err) {
      console.error('Error saving scooter:', err)
      setError('An error occurred while saving your scooter.')
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || !isStore) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: '#111827',
            }}
          >
            Store Access Only
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#4b5563',
              marginBottom: '1.5rem',
            }}
          >
            The <strong>My Scooters</strong> page is only available for store accounts.
            Please sign in with a store account to manage your scooters.
          </p>
          <Link
            href="/auth/login"
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '0.25rem',
              }}
            >
              My Scooters
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              Create and manage the scooters available to hire from your store.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Link
              href="/"
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              ← Back
            </Link>

            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              style={{
                padding: '0.7rem 1.5rem',
                backgroundColor: showForm ? '#6b7280' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
              }}
            >
              {showForm ? 'Cancel' : 'Add Scooter'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleAddScooter}
            style={{
              marginBottom: '1.75rem',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-name"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Scooter Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="scooter-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Honda Scoopy, Yamaha NMAX"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-model"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Model
              </label>
              <input
                id="scooter-model"
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Optional model or year details"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-number-plate"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Number Plate
              </label>
              <input
                id="scooter-number-plate"
                type="text"
                value={form.numberPlate}
                onChange={(e) => setForm({ ...form, numberPlate: e.target.value })}
                placeholder="e.g. ABC-123"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-notes"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Notes
              </label>
              <textarea
                id="scooter-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes such as colour, condition, or special features."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '0.6rem 1.4rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Saving...' : 'Save Scooter'}
            </button>
          </form>
        )}

        <div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.75rem',
            }}
          >
            Your Scooters
          </h2>

          {loading && !showForm && (
            <div
              style={{
                padding: '1rem 0',
                color: '#6b7280',
                fontSize: '0.9rem',
              }}
            >
              Loading scooters...
            </div>
          )}

          {scooters.length === 0 ? (
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '0.5rem',
                border: '1px dashed #d1d5db',
                backgroundColor: '#f9fafb',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.95rem',
              }}
            >
              You haven&apos;t added any scooters yet. Click <strong>Add Scooter</strong> to create your first scooter.
            </div>
          ) : (
            <div
              style={{
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Model
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Number Plate
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Notes
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scooters.map((scooter) => (
                    <tr
                      key={scooter.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#111827',
                          fontWeight: 600,
                        }}
                      >
                        {scooter.name}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#4b5563',
                        }}
                      >
                        {scooter.model || '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#4b5563',
                          fontFamily: 'monospace',
                        }}
                      >
                        {scooter.numberPlate || '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          color: '#4b5563',
                        }}
                      >
                        {scooter.notes || '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                        }}
                      >
                        {new Date(scooter.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

