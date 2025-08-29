// Debug API to test database connection
export default defineEventHandler(async (event) => {
  try {
    const { Client } = await import('pg')
    const client = new Client({
      host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
      database: process.env.POSTGRES_DB || process.env.DB_NAME || 'clube_tiro_db',
      user: process.env.POSTGRES_USER || process.env.DB_USER || 'clube_tiro_user',
      password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'clube_tiro_senha_forte_123'
    })
    
    await client.connect()
    
    const result = await client.query('SELECT NOW() as time, COUNT(*) as user_count FROM users')
    
    await client.end()
    
    return {
      status: 'success',
      connection: 'ok',
      time: result.rows[0].time,
      userCount: result.rows[0].user_count,
      env: {
        host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'postgres',
        port: process.env.POSTGRES_PORT || process.env.DB_PORT || '5432',
        database: process.env.POSTGRES_DB || process.env.DB_NAME || 'clube_tiro_db',
        user: process.env.POSTGRES_USER || process.env.DB_USER || 'clube_tiro_user'
      }
    }
    
  } catch (error) {
    console.error('Database debug error:', error)
    return {
      status: 'error',
      message: error.message,
      stack: error.stack
    }
  }
})