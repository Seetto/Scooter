'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Scooter {
  id: string
  name: string
  model: string | null
  numberPlate: string | null
  vinOrChassisNumber: string | null
  availableUnits: number
  odometer: number | null
  condition: string | null
  pricePerDay: number | null
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED'
  notes: string | null
  createdAt: string
}

export default function ScootersPage() {
  const { data: session, status } = useSession()
  const [scooters, setScooters] = useState<Scooter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingScooter, setEditingScooter] = useState<Scooter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    model: '',
    numberPlate: '',
    vinOrChassisNumber: '',
    odometer: '',
    condition: '',
    pricePerDay: '',
    status: 'AVAILABLE' as 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED',
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

  const resetForm = () => {
    setForm({ 
      name: '',
      model: '', 
      numberPlate: '', 
      vinOrChassisNumber: '',
      odometer: '',
      condition: '',
      pricePerDay: '',
      status: 'AVAILABLE',
      notes: '' 
    })
    setEditingScooter(null)
    setShowForm(false)
  }

  const handleDeleteScooter = async (scooter: Scooter) => {
    const scooterName = scooter.model || scooter.name || 'this scooter'
    
    if (!confirm(`⚠️ WARNING: Are you sure you want to delete "${scooterName}"?\n\nThis will permanently delete:\n- The scooter\n- All bookings associated with this scooter\n\nThis action cannot be undone!`)) {
      return
    }

    // Double confirmation for safety
    if (!confirm(`Final confirmation: Delete "${scooterName}" and all related bookings?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/scooters/${scooter.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete scooter')
        return
      }

      // Remove the scooter from the list
      setScooters((prev) => prev.filter((s) => s.id !== scooter.id))
      
      // Show success message
      alert(data.message || 'Scooter deleted successfully.')
    } catch (err) {
      console.error('Error deleting scooter:', err)
      setError('An error occurred while deleting the scooter.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditScooter = (scooter: Scooter) => {
    setEditingScooter(scooter)
    setForm({
      name: scooter.name || '',
      model: scooter.model || '',
      numberPlate: scooter.numberPlate || '',
      vinOrChassisNumber: scooter.vinOrChassisNumber || '',
      odometer: scooter.odometer ? String(scooter.odometer) : '',
      condition: scooter.condition || '',
      pricePerDay: scooter.pricePerDay ? String(scooter.pricePerDay) : '',
      status: scooter.status,
      notes: scooter.notes || '',
    })
    setShowForm(true)
  }

  const handleAddScooter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.model.trim() || !form.numberPlate.trim()) return

    try {
      setLoading(true)
      setError(null)

      const url = editingScooter 
        ? `/api/scooters/${editingScooter.id}`
        : '/api/scooters'
      const method = editingScooter ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.model, // Using model as the name
          model: form.model,
          numberPlate: form.numberPlate,
          vinOrChassisNumber: form.vinOrChassisNumber || null,
          availableUnits: 1, // Always 1 - units are counted by model
          odometer: form.odometer ? parseInt(form.odometer) : null,
          condition: form.condition || null,
          pricePerDay: form.pricePerDay ? parseFloat(form.pricePerDay) : null,
          status: form.status,
          notes: form.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save scooter')
        return
      }

      if (editingScooter) {
        // Update existing scooter in the list
        setScooters((prev) => prev.map((s) => s.id === editingScooter.id ? data.scooter : s))
      } else {
        // Add new scooter to the list
        const newScooter = data.scooter as Scooter
        setScooters((prev) => [newScooter, ...prev])
      }
      
      resetForm()
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
              onClick={() => {
                if (showForm) {
                  resetForm()
                } else {
                  setShowForm(true)
                }
              }}
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
            {editingScooter && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                Editing: {editingScooter.model || editingScooter.name}
              </div>
            )}
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
                Model <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="scooter-model"
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
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
                htmlFor="scooter-number-plate"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Plate Number <span style={{ color: '#ef4444' }}>*</span>
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
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-vin"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                VIN or Chassis Number
              </label>
              <input
                id="scooter-vin"
                type="text"
                value={form.vinOrChassisNumber}
                onChange={(e) => setForm({ ...form, vinOrChassisNumber: e.target.value })}
                placeholder="Optional VIN or chassis number"
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
                htmlFor="scooter-odometer"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Odometer
              </label>
              <input
                id="scooter-odometer"
                type="number"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                placeholder="Current odometer reading"
                min="0"
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
                htmlFor="scooter-condition"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Condition
              </label>
              <input
                id="scooter-condition"
                type="text"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="e.g. Excellent, Good, Fair"
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
                htmlFor="scooter-price-per-day"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Price per Day (Rupiah)
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  Rp
                </span>
                <input
                  id="scooter-price-per-day"
                  type="number"
                  step="1"
                  min="0"
                  value={form.pricePerDay}
                  onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="scooter-status"
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="scooter-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                }}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="RENTED">Rented</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RESERVED">Reserved</option>
              </select>
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
              {loading ? (editingScooter ? 'Updating...' : 'Saving...') : (editingScooter ? 'Update Scooter' : 'Save Scooter')}
            </button>
          </form>
        )}

        <div>
          {/* Summary Section */}
          {scooters.length > 0 && (() => {
            const totalScooters = scooters.length
            const modelCounts: Record<string, number> = {}
            
            scooters.forEach((scooter) => {
              const model = scooter.model || scooter.name || 'Unknown'
              modelCounts[model] = (modelCounts[model] || 0) + 1
            })

            return (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '0.75rem',
                  }}
                >
                  Scooter Summary
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#374151' }}>Total Scooters: </strong>
                  <span style={{ color: '#6b7280' }}>{totalScooters}</span>
                </div>
                <div>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                    By Model:
                  </strong>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.5rem',
                    }}
                  >
                    {Object.entries(modelCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([model, count]) => (
                        <div
                          key={model}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'white',
                            borderRadius: '0.375rem',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.875rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#111827' }}>{model}:</span>{' '}
                          <span style={{ color: '#6b7280' }}>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )
          })()}

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
                      ID
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
                      Price/Day
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
                      Status
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
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scooters.map((scooter, index) => (
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
                        {index + 1}
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
                          fontWeight: 600,
                        }}
                      >
                        {scooter.pricePerDay ? `Rp ${scooter.pricePerDay.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor:
                              scooter.status === 'AVAILABLE'
                                ? '#d1fae5'
                                : scooter.status === 'RENTED'
                                ? '#dbeafe'
                                : scooter.status === 'MAINTENANCE'
                                ? '#fef3c7'
                                : '#f3e8ff',
                            color:
                              scooter.status === 'AVAILABLE'
                                ? '#065f46'
                                : scooter.status === 'RENTED'
                                ? '#1e40af'
                                : scooter.status === 'MAINTENANCE'
                                ? '#92400e'
                                : '#6b21a8',
                          }}
                        >
                          {scooter.status}
                        </span>
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
                      <td
                        style={{
                          padding: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleEditScooter(scooter)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1d4ed8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScooter(scooter)}
                            disabled={loading}
                            style={{
                              padding: '0.4rem 0.8rem',
                              backgroundColor: loading ? '#9ca3af' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#dc2626'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#ef4444'
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
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

