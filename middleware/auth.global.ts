// Global authentication middleware for hierarchical club system
import type { AuthContext } from '~/models/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth for public routes
  const publicRoutes = ['/login', '/register', '/']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Check for authentication token
  const token = useCookie('auth-token')
  
  if (!token.value) {
    return navigateTo('/login')
  }

  try {
    // Validate token with server-side API call
    const response = await $fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.valid) {
      // Store user context for the session
      const authContext: AuthContext = response.user
      
      // Store auth context in useState for global access
      useState('auth.user', () => authContext)
    } else {
      throw new Error('Invalid token')
    }
    
  } catch (error) {
    // Token is invalid, clear it and redirect to login
    console.error('Invalid token:', error)
    token.value = null
    return navigateTo('/login')
  }
})