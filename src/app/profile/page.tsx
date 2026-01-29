'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface ProfileUser {
  id: string
  email: string
  name: string | null
  phoneNumber: string | null
  hotelAddress: string | null
  rentalDuration: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { status } = useSession()
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    hotelAddress: '',
    rentalDuration: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to load profile')
          return
        }
        const u = data.user as ProfileUser
        setUser(u)
        setForm({
          name: u.name || '',
          email: u.email,
          phoneNumber: u.phoneNumber || '',
          hotelAddress: u.hotelAddress || '',
          rentalDuration: u.rentalDuration || '',
        })
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('An error occurred while loading your profile.')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      loadProfile()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setError('You need to be signed in to view your profile.')
    }
  }, [status])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }
      setUser(data.user as ProfileUser)
    } catch (err) {
      console.error('Profile update error:', err)
      setError('An error occurred while saving your profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Please fill in your current and new password.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setError('New passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update password')
        return
      }
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (err) {
      console.error('Password update error:', err)
      setError('An error occurred while updating your password.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
        }}
      >
        Loading profile...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                color: '#111827',
              }}
            >
              My Profile
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              View and update your account details.
            </p>
          </div>
          <Link
            href="/"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              textDecoration: 'none',
              backgroundColor: '#ffffff',
            }}
          >
            ← Back to home
          </Link>
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

        {!user ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              fontSize: '0.95rem',
            }}
          >
            You must be signed in to view your profile.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr)',
              gap: '1.75rem',
            }}
          >
            {/* Profile details form */}
            <form onSubmit={handleProfileSave}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: '#111827',
                }}
              >
                Account details
              </h2>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="phoneNumber"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Phone number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="hotelAddress"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Hotel / villa address
                </label>
                <textarea
                  id="hotelAddress"
                  rows={2}
                  value={form.hotelAddress}
                  onChange={(e) => setForm({ ...form, hotelAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="rentalDuration"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Rental duration (notes)
                </label>
                <input
                  id="rentalDuration"
                  type="text"
                  value={form.rentalDuration}
                  onChange={(e) => setForm({ ...form, rentalDuration: e.target.value })}
                  placeholder="e.g. 2026-02-01 to 2026-02-05"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: saving ? '#9ca3af' : '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>

            {/* Password form */}
            <form onSubmit={handlePasswordSave}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: '#111827',
                }}
              >
                Update password
              </h2>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="currentPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="newPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="confirmNewPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Confirm new password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: saving ? '#9ca3af' : '#111827',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

