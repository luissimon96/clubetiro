#!/usr/bin/env node

/**
 * Database Migration Runner for Clube de Tiro
 * 
 * This script automatically runs database migrations in order and tracks
 * their execution to prevent re-running the same migration.
 * 
 * Features:
 * - Automatic migration discovery and ordering
 * - Execution tracking with migration_history table
 * - Transaction-based execution with rollback support
 * - Comprehensive error handling and logging
 * - Health check integration
 * - Docker-compatible with proper exit codes
 */

import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'database', 'migrations');

// Exit codes for container orchestration
const EXIT_CODES = {
  SUCCESS: 0,
  DB_CONNECTION_FAILED: 1,
  MIGRATION_FAILED: 2,
  SETUP_FAILED: 3,
  NO_MIGRATIONS: 0, // Not an error condition
};

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clube_tiro_db',
  user: process.env.DB_USER || 'clube_tiro_user',
  password: process.env.DB_PASSWORD,
  
  // Connection settings optimized for migrations
  max: 2, // Minimal connections for migration process
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  
  application_name: 'clubetiro_migrate',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Logger utility
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...args),
  success: (msg, ...args) => console.log(`[SUCCESS] ${new Date().toISOString()} ${msg}`, ...args),
};

/**
 * Migration tracking table creation
 * This table tracks which migrations have been executed
 */
const MIGRATION_TRACKING_SQL = `
  CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER NOT NULL,
    checksum VARCHAR(64),
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'rollback')) DEFAULT 'success',
    error_message TEXT,
    migration_content_hash VARCHAR(64) NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
  CREATE INDEX IF NOT EXISTS idx_migration_history_status ON migration_history(status);
`;

/**
 * Connect to database with retry logic
 */
async function connectToDatabase() {
  const pool = new Pool(dbConfig);
  let retryCount = 0;
  const maxRetries = 10;
  const retryDelay = 2000; // 2 seconds

  while (retryCount < maxRetries) {
    try {
      const client = await pool.connect();
      
      // Test connection
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Database connection established successfully');
      return pool;
    } catch (error) {
      retryCount++;
      logger.warn(`Database connection attempt ${retryCount}/${maxRetries} failed: ${error.message}`);
      
      if (retryCount >= maxRetries) {
        logger.error('Max database connection retries exceeded');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Setup migration tracking system
 */
async function setupMigrationTracking(pool) {
  const client = await pool.connect();
  
  try {
    logger.info('Setting up migration tracking table...');
    await client.query(MIGRATION_TRACKING_SQL);
    logger.success('Migration tracking table ready');
  } catch (error) {
    logger.error('Failed to setup migration tracking:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Generate content hash for migration integrity checking
 */
function generateHash(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Discover and sort migration files
 */
async function discoverMigrations() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    
    // Filter for SQL files and sort numerically
    const migrationFiles = files
      .filter(file => extname(file).toLowerCase() === '.sql')
      .sort((a, b) => {
        // Extract number from filename for proper sorting
        const numA = parseInt(a.split('-')[0]) || 0;
        const numB = parseInt(b.split('-')[0]) || 0;
        return numA - numB;
      });

    logger.info(`Discovered ${migrationFiles.length} migration files`);
    return migrationFiles;
  } catch (error) {
    logger.error('Failed to discover migrations:', error.message);
    throw error;
  }
}

/**
 * Check if migration has already been executed
 */
async function isMigrationExecuted(pool, migrationName) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT migration_name, status, checksum FROM migration_history WHERE migration_name = $1',
      [migrationName]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(pool, migrationFile) {
  const migrationPath = join(MIGRATIONS_DIR, migrationFile);
  const migrationName = basename(migrationFile, '.sql');
  
  logger.info(`Executing migration: ${migrationName}`);
  
  const client = await pool.connect();
  const startTime = Date.now();
  
  try {
    // Read migration content
    const migrationContent = await readFile(migrationPath, 'utf-8');
    const contentHash = generateHash(migrationContent);
    
    // Check if already executed
    const existingMigration = await isMigrationExecuted(pool, migrationName);
    if (existingMigration) {
      if (existingMigration.status === 'success') {
        logger.info(`Migration ${migrationName} already executed successfully - skipping`);
        return { skipped: true };
      } else {
        logger.warn(`Migration ${migrationName} previously failed - retrying`);
      }
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Execute migration content
      await client.query(migrationContent);
      
      const executionTime = Date.now() - startTime;
      
      // Record successful execution
      await client.query(`
        INSERT INTO migration_history 
        (migration_name, execution_time_ms, migration_content_hash, status) 
        VALUES ($1, $2, $3, 'success')
        ON CONFLICT (migration_name) 
        DO UPDATE SET 
          executed_at = CURRENT_TIMESTAMP,
          execution_time_ms = EXCLUDED.execution_time_ms,
          migration_content_hash = EXCLUDED.migration_content_hash,
          status = 'success',
          error_message = NULL
      `, [migrationName, executionTime, contentHash]);
      
      // Commit transaction
      await client.query('COMMIT');
      
      logger.success(`Migration ${migrationName} executed successfully (${executionTime}ms)`);
      return { success: true, executionTime };
      
    } catch (migrationError) {
      // Rollback transaction
      await client.query('ROLLBACK');
      
      const executionTime = Date.now() - startTime;
      
      // Record failed execution
      await client.query(`
        INSERT INTO migration_history 
        (migration_name, execution_time_ms, migration_content_hash, status, error_message) 
        VALUES ($1, $2, $3, 'failed', $4)
        ON CONFLICT (migration_name) 
        DO UPDATE SET 
          executed_at = CURRENT_TIMESTAMP,
          execution_time_ms = EXCLUDED.execution_time_ms,
          status = 'failed',
          error_message = EXCLUDED.error_message
      `, [migrationName, executionTime, contentHash, migrationError.message]);
      
      throw migrationError;
    }
    
  } finally {
    client.release();
  }
}

/**
 * Get migration status for health check
 */
async function getMigrationStatus(pool) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_migrations,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_migrations,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_migrations,
        MAX(executed_at) as last_migration_at
      FROM migration_history
    `);
    
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total_migrations),
      successful: parseInt(stats.successful_migrations),
      failed: parseInt(stats.failed_migrations),
      lastMigrationAt: stats.last_migration_at
    };
  } finally {
    client.release();
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  let pool;
  
  try {
    logger.info('Starting database migration process...');
    
    // Connect to database
    pool = await connectToDatabase();
    
    // Setup migration tracking
    await setupMigrationTracking(pool);
    
    // Discover migrations
    const migrationFiles = await discoverMigrations();
    
    if (migrationFiles.length === 0) {
      logger.info('No migration files found');
      return { totalMigrations: 0, executed: 0, skipped: 0 };
    }
    
    // Execute migrations in order
    let executedCount = 0;
    let skippedCount = 0;
    const totalMigrations = migrationFiles.length;
    
    for (const migrationFile of migrationFiles) {
      const result = await executeMigration(pool, migrationFile);
      
      if (result.skipped) {
        skippedCount++;
      } else {
        executedCount++;
      }
    }
    
    // Get final status
    const status = await getMigrationStatus(pool);
    
    logger.success(`Migration process completed successfully`);
    logger.info(`Total migrations: ${totalMigrations}, Executed: ${executedCount}, Skipped: ${skippedCount}`);
    logger.info(`Database migration status: ${status.successful} successful, ${status.failed} failed`);
    
    return {
      totalMigrations,
      executed: executedCount,
      skipped: skippedCount,
      status
    };
    
  } catch (error) {
    logger.error('Migration process failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('Database connection refused. Check if database service is running.');
      process.exit(EXIT_CODES.DB_CONNECTION_FAILED);
    }
    
    process.exit(EXIT_CODES.MIGRATION_FAILED);
    
  } finally {
    if (pool) {
      await pool.end();
      logger.info('Database connection pool closed');
    }
  }
}

/**
 * Health check endpoint for container orchestration
 */
async function healthCheck() {
  let pool;
  
  try {
    pool = await connectToDatabase();
    await setupMigrationTracking(pool);
    
    const status = await getMigrationStatus(pool);
    
    const healthStatus = {
      status: status.failed === 0 ? 'healthy' : 'degraded',
      migrations: status,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(healthStatus, null, 2));
    process.exit(EXIT_CODES.SUCCESS);
    
  } catch (error) {
    const healthStatus = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(healthStatus, null, 2));
    process.exit(EXIT_CODES.DB_CONNECTION_FAILED);
    
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'health':
  case 'healthcheck':
    await healthCheck();
    break;
  
  case 'run':
  case undefined:
    await runMigrations();
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Usage: node migrate.js [run|health]');
    process.exit(1);
}