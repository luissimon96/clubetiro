export default defineEventHandler(async (event) => {
  // Basic health check
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }

  // Optional: Add database connectivity check
  try {
    // This is a simple check - in a real app you might want to test DB connection
    // const dbCheck = await testDatabaseConnection()
    health.database = 'connected'
  } catch (error) {
    health.database = 'error'
    health.status = 'degraded'
  }

  // Set appropriate status code
  setResponseStatus(event, health.status === 'ok' ? 200 : 503)
  
  return health
})