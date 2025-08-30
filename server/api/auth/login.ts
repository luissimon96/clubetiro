// Authentication API for hierarchical club system
import type { LoginResponse } from '~/models/auth'
import { verifyPassword, generateTokens } from '~/server/utils/auth'
import { query, transaction } from '~/utils/database'
import { validateBody } from '~/utils/validation'
import { loginSchema, type LoginRequest } from '~/schemas/auth'
import { withErrorHandling, createNotFoundError } from '~/utils/errorHandler'

const loginHandler = async (event: H3Event): Promise<LoginResponse> => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  }
  
  // Validate request body with Zod schema
  const body = await validateBody(event, loginSchema)
  
  // Find user by email
  const userQuery = `
        SELECT 
          u.id,
          u.nome,
          u.email,
          u.senha_hash,
          u.tipo,
          u.clube_id,
          u.permissoes,
          u.ativo,
          c.nome as clube_nome
        FROM users u
        LEFT JOIN clubes c ON u.clube_id = c.id
        WHERE u.email = $1 AND u.ativo = true
      `
      
      const result = await query(userQuery, [body.email.toLowerCase()])
      
      if (result.rows.length === 0) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Credenciais inválidas',
          data: { code: 'INVALID_CREDENTIALS' }
        })
      }
      
      const user = result.rows[0]
      
      // Verify password
      const isValidPassword = await verifyPassword(body.senha, user.senha_hash)
      
      if (!isValidPassword) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Credenciais inválidas',
          data: { code: 'INVALID_CREDENTIALS' }
        })
      }
      
      // Check if club is active (if user belongs to a club)
      if (user.clube_id) {
        const clubQuery = `SELECT ativo FROM clubes WHERE id = $1`
        const clubResult = await query(clubQuery, [user.clube_id])
        
        if (clubResult.rows.length === 0 || !clubResult.rows[0].ativo) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Clube inativo. Contate o administrador.',
            data: { code: 'CLUB_INACTIVE' }
          })
        }
      }
      
      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        userType: user.tipo,
        clubeId: user.clube_id,
        permissoes: user.permissoes
      })
      
      // Update last login and store session in a transaction
      await transaction(async (client) => {
        // Update last login
        await client.query(
          'UPDATE users SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        )
        
        // Store refresh token in session
        await client.query(`
          INSERT INTO user_sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (refresh_token) DO UPDATE SET last_used_at = CURRENT_TIMESTAMP
        `, [
          user.id,
          tokens.refreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          getHeader(event, 'user-agent') || '',
          getClientIP(event) || ''
        ])
      })
      
      const response: LoginResponse = {
        user: {
          userId: user.id,
          userType: user.tipo,
          clubeId: user.clube_id,
          permissoes: user.permissoes,
          nome: user.nome,
          email: user.email
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
      
      // Set HTTP-only cookie for token (optional, more secure)
      setCookie(event, 'auth-token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expiresIn
      })
      
      return response
}

// Export with error handling wrapper
export default defineEventHandler(withErrorHandling(loginHandler))