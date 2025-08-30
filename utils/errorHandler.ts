import type { H3Event, H3Error } from 'h3'

/**
 * Standardized error response format
 */
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

/**
 * Success response format
 */
interface SuccessResponse<T = any> {
  success: true
  data: T
  timestamp: string
  requestId?: string
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code: code || `ERROR_${statusCode}`,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId
    }
  }
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId
  }
}

/**
 * Enhanced error handling middleware for API routes
 */
export async function handleApiError(
  error: any,
  event: H3Event,
  requestId?: string
): Promise<ErrorResponse> {
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const ip = getClientIP(event) || 'unknown'
  const method = getMethod(event)
  const url = getRequestURL(event)

  // Log error details for debugging
  console.error('API Error:', {
    requestId,
    method,
    url: url.pathname,
    userAgent: userAgent.substring(0, 100), // Truncate for log readability
    ip,
    error: {
      name: error?.name,
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      statusCode: error?.statusCode,
      data: error?.data
    },
    timestamp: new Date().toISOString()
  })

  // Handle H3 errors (created with createError)
  if (error?.statusCode) {
    return createErrorResponse(
      error.statusCode,
      error.statusMessage || error.message || 'Erro interno do servidor',
      error.data?.code,
      process.env.NODE_ENV === 'development' ? error.data : undefined,
      requestId
    )
  }

  // Handle validation errors (from Zod)
  if (error?.name === 'ZodError') {
    return createErrorResponse(
      400,
      'Dados de entrada inválidos',
      'VALIDATION_ERROR',
      {
        errors: error.errors?.map((err: any) => ({
          field: err.path?.join('.'),
          message: err.message,
          code: err.code
        }))
      },
      requestId
    )
  }

  // Handle database errors
  if (error?.code?.startsWith('23')) { // PostgreSQL constraint errors
    let message = 'Erro de dados'
    let details = undefined

    switch (error.code) {
      case '23505': // unique_violation
        message = 'Registro já existe'
        details = { field: error.constraint }
        break
      case '23503': // foreign_key_violation
        message = 'Referência inválida'
        details = { field: error.constraint }
        break
      case '23502': // not_null_violation
        message = 'Campo obrigatório não preenchido'
        details = { field: error.column }
        break
    }

    return createErrorResponse(
      400,
      message,
      'DATABASE_ERROR',
      details,
      requestId
    )
  }

  // Handle authentication errors
  if (error?.message?.includes('jwt') || error?.message?.includes('token')) {
    return createErrorResponse(
      401,
      'Token de acesso inválido ou expirado',
      'AUTH_ERROR',
      undefined,
      requestId
    )
  }

  // Handle connection errors
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return createErrorResponse(
      503,
      'Serviço temporariamente indisponível',
      'SERVICE_UNAVAILABLE',
      undefined,
      requestId
    )
  }

  // Generic server errors
  return createErrorResponse(
    500,
    'Erro interno do servidor',
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? {
      message: error?.message,
      stack: error?.stack
    } : undefined,
    requestId
  )
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling<T>(
  handler: (event: H3Event) => Promise<T>
) {
  return async (event: H3Event): Promise<SuccessResponse<T> | ErrorResponse> => {
    const requestId = generateRequestId()
    
    try {
      const result = await handler(event)
      return createSuccessResponse(result, requestId)
    } catch (error) {
      const errorResponse = await handleApiError(error, event, requestId)
      
      // Set HTTP status code
      setResponseStatus(event, errorResponse.error.code.startsWith('AUTH') ? 401 : 
        errorResponse.error.code === 'VALIDATION_ERROR' ? 400 :
        errorResponse.error.code === 'SERVICE_UNAVAILABLE' ? 503 : 500)
      
      return errorResponse
    }
  }
}

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Rate limiting error
 */
export function createRateLimitError(): H3Error {
  return createError({
    statusCode: 429,
    statusMessage: 'Muitas tentativas. Tente novamente em alguns minutos.',
    data: { code: 'RATE_LIMIT_EXCEEDED' }
  })
}

/**
 * Authentication required error
 */
export function createAuthRequiredError(): H3Error {
  return createError({
    statusCode: 401,
    statusMessage: 'Autenticação necessária',
    data: { code: 'AUTH_REQUIRED' }
  })
}

/**
 * Insufficient permissions error
 */
export function createPermissionError(): H3Error {
  return createError({
    statusCode: 403,
    statusMessage: 'Permissões insuficientes',
    data: { code: 'INSUFFICIENT_PERMISSIONS' }
  })
}

/**
 * Resource not found error
 */
export function createNotFoundError(resource?: string): H3Error {
  return createError({
    statusCode: 404,
    statusMessage: resource ? `${resource} não encontrado` : 'Recurso não encontrado',
    data: { code: 'NOT_FOUND' }
  })
}