'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import StoreLocationPicker to avoid SSR issues
const StoreLocationPicker = dynamic(() => import('@/components/StoreLocationPicker'), {
  ssr: false,
})

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'rider' | 'store' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    hotelAddress: '',
    rentalDuration: '',
    idDocumentImageUrl: '',
    damageAgreement: '',
    password: '',
    confirmPassword: '',
    // Store-specific fields
    storeName: '',
    storeLatitude: null as number | null,
    storeLongitude: null as number | null,
    storeAddress: '',
    storeFrontImageUrl: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDamageAgreement, setShowDamageAgreement] = useState(false)
  const [agreedToDamageAgreement, setAgreedToDamageAgreement] = useState(false)
  const [uploadingPassport, setUploadingPassport] = useState(false)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 5MB.')
      return
    }

    try {
      setUploadingPassport(true)
      setError('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPassportPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload passport photo')
        setPassportPreview(null)
        return
      }

      // Update form data with the uploaded file URL
      setFormData((prev) => ({
        ...prev,
        idDocumentImageUrl: data.url,
      }))
    } catch (err) {
      console.error('Error uploading passport:', err)
      setError('An error occurred while uploading the passport photo')
      setPassportPreview(null)
    } finally {
      setUploadingPassport(false)
    }
  }

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

    // Check damage agreement for rider signup
    if (role === 'rider' && !agreedToDamageAgreement) {
      setError('You must agree to the Damage & Responsibility Agreement to continue')
      setLoading(false)
      return
    }

    // Validation for store signup
    if (role === 'store') {
      if (!formData.storeName) {
        setError('Store name is required')
        setLoading(false)
        return
      }
      if (!formData.storeLatitude || !formData.storeLongitude) {
        setError('Please select your store location on the map')
        setLoading(false)
        return
      }
    }

    try {
      const endpoint = role === 'store' ? '/api/auth/signup/store' : '/api/auth/signup'
      const requestBody = role === 'store' 
        ? {
            email: formData.email,
            password: formData.password,
            name: formData.storeName,
            phoneNumber: formData.phoneNumber,
            latitude: formData.storeLatitude,
            longitude: formData.storeLongitude,
            address: formData.storeAddress,
            storeFrontImageUrl: formData.storeFrontImageUrl || null,
          }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            hotelAddress: formData.hotelAddress,
            rentalDuration: formData.rentalDuration,
            idDocumentImageUrl: formData.idDocumentImageUrl || null,
            damageAgreement: agreedToDamageAgreement ? 'Agreed' : null,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      const successMessage = role === 'store'
        ? 'Store account created successfully! Your account is pending admin approval. You will be able to log in once an admin approves your store.'
        : 'Account created successfully! Please check your email for confirmation and then login.'
      router.push(`/auth/login?message=${encodeURIComponent(successMessage)}`)
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
                  Sign up to list your store and scooters.
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
              {/* Store-specific fields */}
              {role === 'store' && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      htmlFor="storeName"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Store Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="storeName"
                      required
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      placeholder="Enter your store name"
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
                      htmlFor="phoneNumber"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+61 4xx xxx xxx"
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
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Store Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <StoreLocationPicker
                      onLocationSelect={(location, address) => {
                        setFormData({
                          ...formData,
                          storeLatitude: location.lat,
                          storeLongitude: location.lng,
                          storeAddress: address,
                        })
                      }}
                      initialLocation={
                        formData.storeLatitude && formData.storeLongitude
                          ? { lat: formData.storeLatitude, lng: formData.storeLongitude }
                          : null
                      }
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      htmlFor="storeFrontImageUrl"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Store Front Photo (coming soon)
                    </label>
                    <input
                      type="text"
                      id="storeFrontImageUrl"
                      value={formData.storeFrontImageUrl}
                      onChange={(e) => setFormData({ ...formData, storeFrontImageUrl: e.target.value })}
                      placeholder="We'll add photo upload here later"
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px dashed #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        backgroundColor: '#f9fafb',
                        color: '#9ca3af',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Rider-specific fields */}
              {role === 'rider' && (
                <>
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
                      htmlFor="phoneNumber"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+61 4xx xxx xxx"
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
                      htmlFor="hotelAddress"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      Hotel / Villa Address
                    </label>
                    <textarea
                      id="hotelAddress"
                      value={formData.hotelAddress}
                      onChange={(e) => setFormData({ ...formData, hotelAddress: e.target.value })}
                      placeholder="Where are you staying?"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </>
              )}

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

              {role === 'rider' && (
                <div style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
                  <label
                    htmlFor="idDocumentImageUrl"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Passport / Driver&apos;s Licence Photo
                  </label>
                  <input
                    type="file"
                    id="idDocumentImageUrl"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePassportUpload}
                    disabled={uploadingPassport}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      backgroundColor: uploadingPassport ? '#f9fafb' : '#ffffff',
                      cursor: uploadingPassport ? 'not-allowed' : 'pointer',
                    }}
                  />
                  {uploadingPassport && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      Uploading...
                    </p>
                  )}
                  {passportPreview && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img
                        src={passportPreview}
                        alt="Passport preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '0.375rem',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPassportPreview(null)
                          setFormData((prev) => ({ ...prev, idDocumentImageUrl: '' }))
                          const fileInput = document.getElementById('idDocumentImageUrl') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        }}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    Accepted formats: JPEG, PNG, WebP. Maximum size: 5MB
                  </p>
                </div>
              )}

              {role === 'rider' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowDamageAgreement(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        display: 'block',
                      }}
                    >
                      Scooter Rental Damage & Responsibility Agreement
                    </button>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        id="damageAgreementCheck"
                        checked={agreedToDamageAgreement}
                        onChange={(e) => setAgreedToDamageAgreement(e.target.checked)}
                        style={{
                          cursor: 'pointer',
                        }}
                      />
                      <label
                        htmlFor="damageAgreementCheck"
                        style={{
                          fontSize: '0.875rem',
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        I have read and agree to the agreement
                      </label>
                    </div>
                  </div>
                </div>
              )}

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

      {/* Damage Agreement Modal */}
      {showDamageAgreement && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowDamageAgreement(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: '#ffffff',
                zIndex: 10,
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                }}
              >
                Scooter Rental Damage & Responsibility Agreement
              </h2>
              <button
                type="button"
                onClick={() => setShowDamageAgreement(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                padding: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: '1.7',
                color: '#374151',
              }}
            >
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
                By hiring a scooter through this platform, I (&quot;the Renter&quot;) agree to the following terms and conditions relating to the use, care, and return of the rented scooter.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  1. Responsibility for the Scooter
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>
                  I acknowledge that I am responsible for the scooter during the entire rental period, from the time of pickup until it is returned to the rental provider (&quot;the Owner&quot;).
                </p>
                <p style={{ marginBottom: '0.5rem' }}>I agree to:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Operate the scooter in a safe and responsible manner</li>
                  <li>Follow Indonesian traffic laws and local regulations</li>
                  <li>Use the scooter only for personal transportation</li>
                  <li>Not allow any unauthorised person to ride the scooter</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  2. Condition of the Scooter
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I confirm that:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>I have inspected the scooter at the start of the rental</li>
                  <li>Any existing damage has been disclosed and documented</li>
                  <li>The scooter was received in acceptable working condition</li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>
                  Any damage not documented at the start of the rental will be assumed to have occurred during the rental period.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  3. Damage, Loss, or Theft
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I agree that I am financially responsible for:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Any damage to the scooter occurring during the rental period</li>
                  <li>Loss or theft of the scooter, keys, or accessories</li>
                  <li>Damage caused by misuse, negligence, or improper operation</li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>
                  If damage occurs, the Owner may charge reasonable repair costs based on local market rates.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  If the scooter is lost or stolen, I agree to cover the replacement cost unless otherwise covered by insurance (if applicable).
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  4. Accidents & Reporting
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>In the event of:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>An accident</li>
                  <li>Damage to the scooter</li>
                  <li>Injury to myself or others</li>
                  <li>Theft or attempted theft</li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>I agree to:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Inform the Owner immediately</li>
                  <li>Provide accurate details of the incident</li>
                  <li>Cooperate with any reasonable requests related to insurance or reporting</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  5. Insurance (If Applicable)
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I understand that:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Insurance coverage, if offered, may be limited</li>
                  <li>Insurance may not cover damage caused by:
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                      <li>Reckless riding</li>
                      <li>Riding under the influence of alcohol or drugs</li>
                      <li>Riding without a valid licence where required</li>
                      <li>Violating local laws</li>
                    </ul>
                  </li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>
                  Any damage not covered by insurance remains my responsibility.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  6. Legal Compliance
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I acknowledge that:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>A valid driver&apos;s licence and/or International Driving Permit may be required by law</li>
                  <li>Failure to comply with local regulations may result in fines, penalties, or liability not covered by the Owner</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  7. Payment for Damages
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I authorise the Owner to:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Deduct repair or replacement costs from any security deposit (if provided)</li>
                  <li>Request payment for damages not covered by a deposit or insurance</li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>All charges will be communicated clearly.</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  8. Limitation of Liability
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>I understand that the Owner and platform:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>Are not responsible for personal injury, loss, or damage to personal belongings</li>
                  <li>Do not accept liability for accidents occurring during the rental period</li>
                </ul>
                <p style={{ marginBottom: '0.5rem' }}>I rent and operate the scooter at my own risk.</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  9. Agreement & Acceptance
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>By signing or accepting this agreement, I confirm that:</p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                  <li>I have read and understood the terms above</li>
                  <li>I agree to be bound by this agreement</li>
                  <li>I accept responsibility for the scooter during the rental period</li>
                </ul>
              </div>

              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowDamageAgreement(false)
                    setAgreedToDamageAgreement(true)
                  }}
                  style={{
                    padding: '0.6rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
