// Authentication API for hierarchical club system
import type { LoginRequest, LoginResponse } from '~/models/auth'
import { verifyPassword, generateTokens } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  }
  
  const body = await readBody(event) as LoginRequest
  
  if (!body.email || !body.senha) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e senha são obrigatórios'
    })
  }
  
  try {
    const db = await getDatabaseConnection()
    
    try {
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
      
      const result = await db.query(userQuery, [body.email.toLowerCase()])
      
      if (result.rows.length === 0) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Credenciais inválidas'
        })
      }
      
      const user = result.rows[0]
      
      // Verify password
      const isValidPassword = await verifyPassword(body.senha, user.senha_hash)
      
      if (!isValidPassword) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Credenciais inválidas'
        })
      }
      
      // Check if club is active (if user belongs to a club)
      if (user.clube_id) {
        const clubQuery = `SELECT ativo FROM clubes WHERE id = $1`
        const clubResult = await db.query(clubQuery, [user.clube_id])
        
        if (clubResult.rows.length === 0 || !clubResult.rows[0].ativo) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Clube inativo. Contate o administrador.'
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
      
      // Update last login
      await db.query(
        'UPDATE users SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )
      
      // Store refresh token in session (optional, for better security)
      await db.query(`
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
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Don't leak internal errors
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

async function getDatabaseConnection() {
  const { Client } = await import('pg')
  const client = new Client({
    host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
    database: process.env.POSTGRES_DB || process.env.DB_NAME || 'clube_tiro_db',
    user: process.env.POSTGRES_USER || process.env.DB_USER || 'clube_tiro_user',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'clube_tiro_senha_forte_123'
  })
  await client.connect()
  return client
}