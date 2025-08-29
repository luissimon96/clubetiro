// Server-side authentication utilities for hierarchical club system
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import type { JWTPayload, AuthContext, UserType, ClubAdminPermissions } from '~/models/auth'

// JWT token management
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const runtimeConfig = useRuntimeConfig()
  const accessTokenExpiry = 15 * 60 // 15 minutes
  const refreshTokenExpiry = 7 * 24 * 60 * 60 // 7 days
  
  const accessToken = jwt.sign(
    { ...payload, iat: Date.now() / 1000 },
    runtimeConfig.jwtSecret,
    { expiresIn: accessTokenExpiry }
  )
  
  const refreshToken = jwt.sign(
    { userId: payload.userId, iat: Date.now() / 1000 },
    runtimeConfig.jwtRefreshSecret,
    { expiresIn: refreshTokenExpiry }
  )
  
  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpiry
  }
}

export function verifyToken(token: string): JWTPayload {
  const runtimeConfig = useRuntimeConfig()
  return jwt.verify(token, runtimeConfig.jwtSecret) as JWTPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  const runtimeConfig = useRuntimeConfig()
  return jwt.verify(token, runtimeConfig.jwtRefreshSecret) as { userId: string }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Authentication middleware for API routes
export async function requireAuth(event: H3Event): Promise<AuthContext> {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '') || getCookie(event, 'auth-token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de acesso requerido'
    })
  }
  
  try {
    const decoded = verifyToken(token)
    
    // Set context for RLS policies
    await setDatabaseContext(event, decoded)
    
    return {
      userId: decoded.userId,
      userType: decoded.userType,
      clubeId: decoded.clubeId,
      permissoes: decoded.permissoes,
      nome: '', // Will be populated from database if needed
      email: ''  // Will be populated from database if needed
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado'
    })
  }
}

export async function requireSystemAdmin(event: H3Event): Promise<AuthContext> {
  const user = await requireAuth(event)
  
  if (user.userType !== 'system_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Apenas administradores do sistema.'
    })
  }
  
  return user
}

export async function requireClubAccess(event: H3Event, requiredClubId?: string): Promise<AuthContext> {
  const user = await requireAuth(event)
  
  // System admins have access to everything
  if (user.userType === 'system_admin') {
    return user
  }
  
  // Check if user belongs to a club
  if (!user.clubeId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Usuário não está vinculado a nenhum clube'
    })
  }
  
  // Check if user has access to the specific club
  if (requiredClubId && user.clubeId !== requiredClubId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Você só pode acessar dados do seu clube.'
    })
  }
  
  return user
}

export function requirePermissions(
  user: AuthContext, 
  requiredPermissions: (keyof ClubAdminPermissions)[]
): void {
  // System admins have all permissions
  if (user.userType === 'system_admin') {
    return
  }
  
  // Only club admins have granular permissions
  if (user.userType !== 'club_admin' || !user.permissoes) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permissões insuficientes'
    })
  }
  
  const missingPermissions = requiredPermissions.filter(
    permission => !user.permissoes![permission]
  )
  
  if (missingPermissions.length > 0) {
    throw createError({
      statusCode: 403,
      statusMessage: `Permissões necessárias: ${missingPermissions.join(', ')}`
    })
  }
}

// Database context for Row Level Security
async function setDatabaseContext(event: H3Event, user: JWTPayload) {
  // This would be implemented with your database connection
  // Example for PostgreSQL with pg:
  /*
  const db = getDatabase(event)
  await db.query(`
    SELECT set_config('app.user_id', $1, true),
           set_config('app.user_type', $2, true),
           set_config('app.user_club_id', $3, true)
  `, [user.userId, user.userType, user.clubeId || null])
  */
}

// Authorization helpers
export function canAccessClub(user: AuthContext, targetClubId?: string): boolean {
  if (user.userType === 'system_admin') return true
  if (!targetClubId) return true // Global resources
  return user.clubeId === targetClubId
}

export function canManageUser(manager: AuthContext, targetUserType: UserType, targetClubId?: string): boolean {
  // System admin can manage anyone
  if (manager.userType === 'system_admin') return true
  
  // Club admin can only manage users from their club
  if (manager.userType === 'club_admin' && manager.clubeId === targetClubId) {
    // Club admin cannot manage other club admins or system admins
    return !['system_admin', 'club_admin'].includes(targetUserType)
  }
  
  return false
}

// Utility to extract club ID from route
export function getClubIdFromRoute(event: H3Event): string | undefined {
  const params = getRouterParams(event)
  return params.clubId as string | undefined
}