'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setMessage(msg)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // Check if it's a pending store approval error
        if (result.error.includes('pending admin approval')) {
          setError('Your store account is pending admin approval. Please wait for approval before logging in.')
        } else {
          setError('Invalid email or password')
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          textAlign: 'center',
          color: '#1f2937',
        }}>
          Sign In
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem',
        }}>
          Welcome back! Please sign in to your account
        </p>

        {message && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
            }}>
              Email or Username
            </label>
            <input
              type="text"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email or username"
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
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
            }}>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}>
          Don't have an account?{' '}
          <Link href="/auth/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#f9fafb',
      }}>
        <div>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
