import { healthCheck, getPoolStats } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Check database health
    const dbHealth = await healthCheck()
    
    // Get system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    }

    // Overall health status
    const isHealthy = dbHealth.status === 'healthy'
    
    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: systemInfo.timestamp,
      uptime: systemInfo.uptime,
      environment: systemInfo.environment,
      services: {
        database: {
          status: dbHealth.status,
          message: dbHealth.message,
          connectionPool: dbHealth.stats
        },
        application: {
          status: 'ok',
          nodeVersion: systemInfo.nodeVersion,
          memory: systemInfo.memory
        }
      }
    }
  } catch (error) {
    console.error('Health check failed:', error)
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: {
          status: 'error',
          message: 'Database health check failed'
        },
        application: {
          status: 'ok',
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
          }
        }
      }
    }
  }
})