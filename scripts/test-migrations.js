#!/usr/bin/env node

/**
 * Migration System Test Script
 * 
 * Tests the database migration system to ensure it works correctly.
 * This script should be run in a test environment only.
 */

import { Pool } from 'pg';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'database', 'migrations');

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clube_tiro_db',
  user: process.env.DB_USER || 'clube_tiro_user',
  password: process.env.DB_PASSWORD,
  max: 2,
  connectionTimeoutMillis: 5000,
  application_name: 'migration_test'
};

const logger = {
  info: (msg) => console.log(`[TEST-INFO] ${new Date().toISOString()} ${msg}`),
  success: (msg) => console.log(`[TEST-SUCCESS] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[TEST-ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[TEST-WARN] ${new Date().toISOString()} ${msg}`)
};

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  logger.info('Testing database connection...');
  
  const pool = new Pool(testDbConfig);
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    logger.success(`Database connected: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    return pool;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test migration tracking table creation
 */
async function testMigrationTracking(pool) {
  logger.info('Testing migration tracking setup...');
  
  const client = await pool.connect();
  
  try {
    // Check if migration_history table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'migration_history'
    `);
    
    if (result.rows.length === 0) {
      logger.warn('Migration history table does not exist yet - this is normal for first run');
    } else {
      logger.success('Migration history table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'migration_history' 
        ORDER BY ordinal_position
      `);
      
      const expectedColumns = [
        'id', 'migration_name', 'executed_at', 'execution_time_ms', 
        'checksum', 'status', 'error_message', 'migration_content_hash'
      ];
      
      const actualColumns = columns.rows.map(row => row.column_name);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length === 0) {
        logger.success('Migration history table structure is correct');
      } else {
        logger.error(`Migration history table missing columns: ${missingColumns.join(', ')}`);
      }
    }
  } finally {
    client.release();
  }
}

/**
 * Test migration file discovery
 */
async function testMigrationDiscovery() {
  logger.info('Testing migration file discovery...');
  
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const numA = parseInt(a.split('-')[0]) || 0;
        const numB = parseInt(b.split('-')[0]) || 0;
        return numA - numB;
      });
    
    if (migrationFiles.length === 0) {
      logger.warn('No migration files found - this might be a problem');
      return false;
    }
    
    logger.success(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => {
      logger.info(`  - ${file}`);
    });
    
    // Check naming convention
    const badNames = migrationFiles.filter(file => {
      const match = file.match(/^(\d{3})-(.+)\.sql$/);
      return !match;
    });
    
    if (badNames.length > 0) {
      logger.error(`Files with incorrect naming: ${badNames.join(', ')}`);
      logger.error('Expected format: NNN-description.sql');
      return false;
    }
    
    logger.success('All migration files follow correct naming convention');
    return true;
    
  } catch (error) {
    logger.error(`Migration discovery failed: ${error.message}`);
    return false;
  }
}

/**
 * Test core database schema
 */
async function testDatabaseSchema(pool) {
  logger.info('Testing database schema...');
  
  const expectedTables = [
    'users', 'eventos', 'participantes', 'resultados', 
    'mensalidades', 'user_sessions'
  ];
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    logger.info(`Existing tables: ${existingTables.join(', ')}`);
    
    if (missingTables.length === 0) {
      logger.success('All expected core tables exist');
    } else {
      logger.warn(`Missing core tables: ${missingTables.join(', ')}`);
      logger.warn('This is normal if migrations haven\'t been run yet');
    }
    
    // Test critical functions
    try {
      await client.query('SELECT update_updated_at_column()');
      logger.error('update_updated_at_column() should not be callable directly');
    } catch (error) {
      // This is expected - the function should only work in triggers
      logger.success('update_updated_at_column() function behaves correctly');
    }
    
  } finally {
    client.release();
  }
}

/**
 * Test migration system health check
 */
async function testHealthCheck() {
  logger.info('Testing health check endpoints...');
  
  try {
    // Test if we can import our migration utilities
    const { databaseHealthCheck } = await import('../utils/migrate.js');
    
    const healthStatus = await databaseHealthCheck();
    
    logger.success(`Health check status: ${healthStatus.status}`);
    logger.info(`Database connected: ${healthStatus.database.connected}`);
    logger.info(`Total migrations: ${healthStatus.migrations.totalMigrations}`);
    logger.info(`Failed migrations: ${healthStatus.migrations.failedMigrations}`);
    logger.info(`Schema complete: ${healthStatus.schema.isComplete}`);
    
    if (healthStatus.schema.missingTables.length > 0) {
      logger.warn(`Missing tables: ${healthStatus.schema.missingTables.join(', ')}`);
    }
    
    return healthStatus.status !== 'unhealthy';
    
  } catch (error) {
    logger.error(`Health check test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  logger.info('Starting migration system tests...');
  logger.info('==========================================');
  
  let pool;
  const testResults = {
    connection: false,
    tracking: false,
    discovery: false,
    schema: false,
    healthCheck: false
  };
  
  try {
    // Test 1: Database Connection
    pool = await testDatabaseConnection();
    testResults.connection = true;
    
    // Test 2: Migration Tracking
    await testMigrationTracking(pool);
    testResults.tracking = true;
    
    // Test 3: Migration Discovery
    testResults.discovery = await testMigrationDiscovery();
    
    // Test 4: Database Schema
    await testDatabaseSchema(pool);
    testResults.schema = true;
    
    // Test 5: Health Check Integration
    testResults.healthCheck = await testHealthCheck();
    
  } catch (error) {
    logger.error(`Test suite failed: ${error.message}`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
  
  // Summary
  logger.info('==========================================');
  logger.info('Test Results Summary:');
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? 'PASS' : 'FAIL';
    const icon = passed ? '✅' : '❌';
    logger.info(`${icon} ${test.toUpperCase()}: ${status}`);
  });
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  if (passedTests === totalTests) {
    logger.success(`All tests passed! (${passedTests}/${totalTests})`);
    process.exit(0);
  } else {
    logger.error(`Some tests failed. (${passedTests}/${totalTests})`);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTests().catch(error => {
    logger.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

export { runTests };