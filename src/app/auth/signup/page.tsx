'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'rider' | 'store' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        setError('Server error: Received invalid response. Please try again.')
        setLoading(false)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Redirect to login page with success message
      router.push('/auth/login?message=Account created successfully! Please check your email for confirmation and then login.')
    } catch (err) {
      console.error('Signup error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`An error occurred: ${errorMessage}. Please check your connection and try again.`)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: role ? '420px' : '480px',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Step 1: choose account type */}
        {!role && (
          <>
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                textAlign: 'center',
                color: '#1f2937',
              }}
            >
              Sign Up
            </h1>
            <p
              style={{
                textAlign: 'center',
                color: '#6b7280',
                marginBottom: '1.5rem',
              }}
            >
              Choose how you want to use Scooter
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setRole('rider')}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #2563eb',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Rider
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    marginTop: '0.25rem',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  Sign up to find scooters near you.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('store')}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Store
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    marginTop: '0.25rem',
                    color: '#4b5563',
                  }}
                >
                  Sign up to list your store and scooters. (Coming soon)
                </div>
              </button>
            </div>

            <p
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem',
                marginTop: '1.5rem',
              }}
            >
              Already have an account?{' '}
              <Link
                href="/auth/login"
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* Step 2: show signup form for selected role (Rider or Store) */}
        {role && (
          <>
            <button
              type="button"
              onClick={() => setRole(null)}
              style={{
                border: 'none',
                background: 'none',
                color: '#2563eb',
                fontSize: '0.85rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ← Back to choose account type
            </button>

            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                textAlign: 'center',
                color: '#1f2937',
              }}
            >
              {role === 'rider' ? 'Rider Sign Up' : 'Store Sign Up'}
            </h1>
            <p
              style={{
                textAlign: 'center',
                color: '#6b7280',
                marginBottom: '2rem',
              }}
            >
              {role === 'rider'
                ? 'Create your rider account to get started.'
                : 'Create your store account to get started.'}
            </p>

            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem',
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </>
        )}

        {role && (
          <p style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.875rem',
          }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
