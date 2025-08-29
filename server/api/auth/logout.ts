// Logout API for hierarchical club system
export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  }
  
  try {
    // Get refresh token from request body or cookie
    const body = await readBody(event).catch(() => ({}))
    const refreshToken = body.refreshToken || getCookie(event, 'refresh-token')
    
    if (refreshToken) {
      // Invalidate refresh token in database
      const db = await getDatabaseConnection()
      try {
        await db.query(
          'DELETE FROM user_sessions WHERE refresh_token = $1',
          [refreshToken]
        )
      } finally {
        await db.end()
      }
    }
    
    // Clear cookies
    deleteCookie(event, 'auth-token')
    deleteCookie(event, 'refresh-token')
    
    return {
      success: true,
      message: 'Logout realizado com sucesso'
    }
    
  } catch (error) {
    console.error('Logout error:', error)
    
    // Always return success for logout (security best practice)
    return {
      success: true,
      message: 'Logout realizado com sucesso'
    }
  }
})

async function getDatabaseConnection() {
  const { Client } = await import('pg')
  const client = new Client({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'clube_tiro_db',
    user: process.env.DB_USER || 'clube_tiro_user',
    password: process.env.DB_PASSWORD || 'clube_tiro_pass'
  })
  await client.connect()
  return client
}