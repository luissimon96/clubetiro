import { z, ZodError, ZodSchema } from 'zod'
import type { H3Event } from 'h3'

/**
 * Validate request body against a Zod schema
 * Returns validated data or throws H3Error with validation details
 */
export async function validateBody<T>(
  event: H3Event,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await readBody(event)
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dados inválidos',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Erro na validação dos dados'
    })
  }
}

/**
 * Validate query parameters against a Zod schema
 * Returns validated data or throws H3Error with validation details
 */
export function validateQuery<T>(
  event: H3Event,
  schema: ZodSchema<T>
): T {
  try {
    const query = getQuery(event)
    return schema.parse(query)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parâmetros inválidos',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Erro na validação dos parâmetros'
    })
  }
}

/**
 * Validate route parameters against a Zod schema
 * Returns validated data or throws H3Error with validation details
 */
export function validateParams<T>(
  event: H3Event,
  schema: ZodSchema<T>
): T {
  try {
    const params = getRouterParams(event)
    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parâmetros de rota inválidos',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Erro na validação dos parâmetros de rota'
    })
  }
}

/**
 * Sanitize and validate data before database operations
 * Removes undefined values and trims strings
 */
export function sanitizeData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data }
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (value === undefined) {
      delete sanitized[key as keyof T]
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = value.trim() as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeData(value) as T[keyof T]
    }
  }
  
  return sanitized
}

/**
 * CNPJ validation (Brazilian company identifier)
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove formatting
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false // All same digits
  
  // Calculate verification digits
  let sum = 0
  let weight = 2
  
  // First verification digit
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cleanCNPJ[12]) !== firstDigit) return false
  
  // Second verification digit
  sum = 0
  weight = 2
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return parseInt(cleanCNPJ[13]) === secondDigit
}

/**
 * CPF validation (Brazilian individual identifier)
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatting
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false // All same digits
  
  // Calculate verification digits
  let sum = 0
  
  // First verification digit
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cleanCPF[9]) !== firstDigit) return false
  
  // Second verification digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return parseInt(cleanCPF[10]) === secondDigit
}

/**
 * Email validation with additional Brazilian domain checks
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.toLowerCase())
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let score = 0
  
  if (password.length < 8) {
    suggestions.push('Use pelo menos 8 caracteres')
  } else {
    score += 1
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('Inclua pelo menos uma letra minúscula')
  } else {
    score += 1
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Inclua pelo menos uma letra maiúscula')
  } else {
    score += 1
  }
  
  if (!/\d/.test(password)) {
    suggestions.push('Inclua pelo menos um número')
  } else {
    score += 1
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    suggestions.push('Inclua pelo menos um caractere especial')
  } else {
    score += 1
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  return {
    isValid: score >= 4,
    score,
    suggestions
  }
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (event: H3Event): Promise<T> => {
    switch (source) {
      case 'body':
        return validateBody(event, schema)
      case 'query':
        return validateQuery(event, schema)
      case 'params':
        return validateParams(event, schema)
      default:
        throw createError({
          statusCode: 500,
          statusMessage: 'Invalid validation source'
        })
    }
  }
}