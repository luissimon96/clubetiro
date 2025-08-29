// Token validation API for client-side middleware
import { verifyToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  }

  try {
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return {
        valid: false,
        error: 'Token não fornecido'
      }
    }

    // Verify token using server-side function
    const decoded = verifyToken(token)
    
    // Get user information from database
    const db = await getDatabaseConnection()
    
    try {
      const userQuery = `
        SELECT 
          u.id,
          u.nome,
          u.email,
          u.tipo,
          u.clube_id,
          u.permissoes,
          c.nome as clube_nome
        FROM users u
        LEFT JOIN clubes c ON u.clube_id = c.id
        WHERE u.id = $1 AND u.ativo = true
      `
      
      const result = await db.query(userQuery, [decoded.userId])
      
      if (result.rows.length === 0) {
        return {
          valid: false,
          error: 'Usuário não encontrado'
        }
      }

      const user = result.rows[0]

      return {
        valid: true,
        user: {
          userId: user.id,
          userType: user.tipo,
          clubeId: user.clube_id,
          permissoes: user.permissoes,
          nome: user.nome,
          email: user.email,
          clubeNome: user.clube_nome
        }
      }
      
    } finally {
      await db.end()
    }

  } catch (error) {
    console.error('Token validation error:', error)
    
    return {
      valid: false,
      error: 'Token inválido ou expirado'
    }
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