/**
 * Enhanced Health Check API Endpoint with Migration Support
 * 
 * Provides comprehensive health status including database connectivity,
 * migration status, and application readiness for container orchestration.
 */

import { healthCheck, getPoolStats } from '~/utils/database';
import { databaseHealthCheck } from '~/utils/migrate';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  
  try {
    // Get enhanced database and migration health status
    const enhancedHealthStatus = await databaseHealthCheck();
    
    // Get legacy database health for compatibility
    const legacyDbHealth = await healthCheck();
    
    // Get connection pool statistics
    const poolStats = getPoolStats();
    
    const responseTime = Date.now() - startTime;
    
    const healthResponse = {
      status: enhancedHealthStatus.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      
      // Enhanced service status
      services: {
        database: {
          status: enhancedHealthStatus.database.connected ? 'ok' : 'error',
          connected: enhancedHealthStatus.database.connected,
          version: enhancedHealthStatus.database.version,
          currentTime: enhancedHealthStatus.database.currentTime,
          connectionPool: {
            totalConnections: poolStats.totalCount,
            idleConnections: poolStats.idleCount,
            waitingQueries: poolStats.waitingCount,
            maxConnections: poolStats.maxConnections
          }
        },
        
        migrations: {
          status: enhancedHealthStatus.migrations.isUpToDate ? 'ok' : 'error',
          isUpToDate: enhancedHealthStatus.migrations.isUpToDate,
          totalMigrations: enhancedHealthStatus.migrations.totalMigrations,
          failedMigrations: enhancedHealthStatus.migrations.failedMigrations,
          lastMigrationAt: enhancedHealthStatus.migrations.lastMigrationAt
        },
        
        schema: {
          status: enhancedHealthStatus.schema.isComplete ? 'ok' : 'error',
          isComplete: enhancedHealthStatus.schema.isComplete,
          missingTables: enhancedHealthStatus.schema.missingTables
        },
        
        application: {
          status: 'ok',
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          }
        }
      }
    };
    
    // Set appropriate HTTP status code based on health
    let statusCode = 200;
    
    switch (enhancedHealthStatus.status) {
      case 'healthy':
        statusCode = 200;
        break;
      case 'degraded':
        statusCode = 200; // Still serving requests, but with issues
        break;
      case 'unhealthy':
        statusCode = 503; // Service unavailable
        break;
    }
    
    setResponseStatus(event, statusCode);
    
    return healthResponse;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Enhanced health check failed:', error);
    
    // Set error status
    setResponseStatus(event, 503);
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      
      services: {
        database: {
          status: 'error',
          connected: false,
          message: 'Database health check failed'
        },
        
        migrations: {
          status: 'error',
          isUpToDate: false,
          totalMigrations: 0,
          failedMigrations: 0
        },
        
        schema: {
          status: 'error',
          isComplete: false,
          missingTables: []
        },
        
        application: {
          status: 'ok',
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
          }
        }
      }
    };
  }
});