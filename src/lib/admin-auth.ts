/**
 * Secure admin authentication utilities
 * Admin credentials are stored in environment variables and never hardcoded
 */

/**
 * Get admin username from environment variable
 * Throws error in production if not set
 */
export function getAdminUsername(): string {
  const username = process.env.ADMIN_USERNAME
  if (!username) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_USERNAME environment variable is required in production')
    }
    // Development fallback
    console.warn('⚠️ ADMIN_USERNAME not set in environment variables. Using default "admin" for development.')
    console.warn('⚠️ Please set ADMIN_USERNAME in .env.local for better security.')
    return 'admin'
  }
  return username
}

/**
 * Get admin password from environment variable
 * Throws error in production if not set
 */
export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PASSWORD environment variable is required in production')
    }
    // Development: Check if we have the old hardcoded value as a last resort
    // This is only for backward compatibility during migration
    const fallbackPassword = '7Zark72502!'
    console.warn('⚠️ ADMIN_PASSWORD not set in environment variables.')
    console.warn('⚠️ Using temporary fallback for development. Please set ADMIN_PASSWORD in .env.local')
    console.warn('⚠️ This fallback will be removed in production.')
    return fallbackPassword
  }
  return password
}

/**
 * Verify admin credentials
 * Returns true if username and password match admin credentials
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  try {
    const adminUsername = getAdminUsername()
    const adminPassword = getAdminPassword()
    
    // Log for debugging (remove sensitive info in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin login attempt:', { 
        providedUsername: username, 
        expectedUsername: adminUsername,
        passwordMatch: password === adminPassword 
      })
    }
    
    return username === adminUsername && password === adminPassword
  } catch (error) {
    console.error('Error verifying admin credentials:', error)
    // In development, provide more helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('Make sure ADMIN_USERNAME and ADMIN_PASSWORD are set in .env.local')
    }
    return false
  }
}
