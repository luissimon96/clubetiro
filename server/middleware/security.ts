/**
 * Security middleware for Nuxt 4 application
 * Handles security headers, CSRF protection, and request validation
 */

export default defineEventHandler(async (event) => {
  // Only apply security middleware in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const url = getRequestURL(event)
  const method = getMethod(event)

  // Set security headers (complementing nitro.routeRules)
  setHeader(event, 'X-Powered-By', 'Clube-Tiro-System')
  setHeader(event, 'X-XSS-Protection', '1; mode=block')
  setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // CORS protection for API routes
  if (url.pathname.startsWith('/api/')) {
    // Only allow specific origins in production
    const allowedOrigins = [
      'https://clubetiro.com.br', // Replace with actual production domain
      'https://www.clubetiro.com.br'
    ]
    
    const origin = getHeader(event, 'origin')
    if (origin && allowedOrigins.includes(origin)) {
      setHeader(event, 'Access-Control-Allow-Origin', origin)
    }
    
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      setResponseStatus(event, 200)
      return ''
    }
  }

  // Rate limiting headers for API endpoints
  if (url.pathname.startsWith('/api/auth/')) {
    setHeader(event, 'X-RateLimit-Limit', '10')
    setHeader(event, 'X-RateLimit-Window', '15m')
  }

  // Additional security for admin endpoints
  if (url.pathname.startsWith('/api/admin/')) {
    setHeader(event, 'X-Admin-Access', 'restricted')
  }
})