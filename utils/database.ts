import { Pool, PoolClient, QueryResult } from 'pg'

// Database connection pool instance
let pool: Pool | null = null

/**
 * Get or create PostgreSQL connection pool
 * Singleton pattern to ensure single pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'clube_tiro_db',
      user: process.env.DB_USER || 'clube_tiro_user',
      password: process.env.DB_PASSWORD,
      
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle (30 seconds)
      connectionTimeoutMillis: 2000, // How long to try connecting before timing out (2 seconds)
      
      // Connection validation
      application_name: 'clubetiro_app',
      
      // SSL configuration (adjust for production)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle PostgreSQL client', err)
      // Don't exit the process, just log the error
    })

    // Handle pool connection
    pool.on('connect', (client: PoolClient) => {
      console.log('New PostgreSQL client connected')
    })

    // Handle pool disconnection  
    pool.on('remove', (client: PoolClient) => {
      console.log('PostgreSQL client removed from pool')
    })

    console.log(`PostgreSQL pool initialized with max ${pool.options.max} connections`)
  }

  return pool
}

/**
 * Execute a query using the connection pool
 * Automatically handles client checkout/release
 */
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  const start = Date.now()
  
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    
    // Log slow queries (> 100ms) in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100))
    }
    
    return result
  } catch (error) {
    console.error('Database query error:', {
      query: text.substring(0, 100),
      params: params ? '[redacted]' : undefined,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * Execute a query with a specific client (for transactions)
 * Use this when you need to maintain connection state across multiple queries
 */
export async function queryWithClient<T = any>(
  client: PoolClient,
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  
  try {
    const result = await client.query<T>(text, params)
    const duration = Date.now() - start
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100))
    }
    
    return result
  } catch (error) {
    console.error('Database query error (with client):', {
      query: text.substring(0, 100),
      params: params ? '[redacted]' : undefined,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * Get a client from the pool for transaction management
 * Remember to call client.release() when done
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

/**
 * Execute multiple queries in a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  const pool = getPool()
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: pool.options.max
  }
}

/**
 * Health check function for the database
 */
export async function healthCheck(): Promise<{ status: string; message: string; stats: any }> {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version')
    const stats = getPoolStats()
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      stats: {
        ...stats,
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
      stats: getPoolStats()
    }
  }
}

/**
 * Gracefully close the connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    console.log('Closing PostgreSQL connection pool...')
    await pool.end()
    pool = null
    console.log('PostgreSQL connection pool closed')
  }
}

// Export the pool instance for advanced use cases
export { pool }

// Default export for convenience
export default {
  query,
  queryWithClient,
  getClient,
  transaction,
  healthCheck,
  getPoolStats,
  closePool,
  getPool
}