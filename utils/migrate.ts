/**
 * Migration utilities for Clube de Tiro
 * 
 * This module provides TypeScript interfaces and utilities for working
 * with the database migration system from within the Nuxt.js application.
 */

import { query, transaction, getClient } from './database';
import type { PoolClient } from 'pg';

export interface MigrationStatus {
  migrationName: string;
  executedAt: string;
  executionTimeMs: number;
  status: 'success' | 'failed' | 'rollback';
  errorMessage?: string;
  migrationContentHash: string;
}

export interface MigrationSummary {
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  lastMigrationAt?: string;
  migrations: MigrationStatus[];
}

/**
 * Get the current migration status from the database
 */
export async function getMigrationStatus(): Promise<MigrationSummary> {
  try {
    // Get summary statistics
    const summaryResult = await query(`
      SELECT 
        COUNT(*) as total_migrations,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_migrations,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_migrations,
        MAX(executed_at) as last_migration_at
      FROM migration_history
    `);

    // Get detailed migration list
    const migrationsResult = await query(`
      SELECT 
        migration_name,
        executed_at,
        execution_time_ms,
        status,
        error_message,
        migration_content_hash
      FROM migration_history
      ORDER BY executed_at DESC
    `);

    const summary = summaryResult.rows[0];

    return {
      totalMigrations: parseInt(summary.total_migrations) || 0,
      successfulMigrations: parseInt(summary.successful_migrations) || 0,
      failedMigrations: parseInt(summary.failed_migrations) || 0,
      lastMigrationAt: summary.last_migration_at,
      migrations: migrationsResult.rows.map((row): MigrationStatus => ({
        migrationName: row.migration_name,
        executedAt: row.executed_at,
        executionTimeMs: row.execution_time_ms,
        status: row.status,
        errorMessage: row.error_message,
        migrationContentHash: row.migration_content_hash
      }))
    };
  } catch (error) {
    // If migration_history table doesn't exist yet, return empty status
    if (error instanceof Error && error.message.includes('relation "migration_history" does not exist')) {
      return {
        totalMigrations: 0,
        successfulMigrations: 0,
        failedMigrations: 0,
        migrations: []
      };
    }
    throw error;
  }
}

/**
 * Check if a specific migration has been executed
 */
export async function isMigrationExecuted(migrationName: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT 1 FROM migration_history WHERE migration_name = $1 AND status = \'success\'',
      [migrationName]
    );
    return result.rows.length > 0;
  } catch (error) {
    // If table doesn't exist, migration hasn't been executed
    return false;
  }
}

/**
 * Verify database schema is up to date
 */
export async function verifyDatabaseSchema(): Promise<{
  isUpToDate: boolean;
  missingTables: string[];
  migrationStatus: MigrationSummary;
}> {
  // Expected core tables after migrations
  const expectedTables = [
    'users',
    'eventos',
    'participantes',
    'resultados',
    'mensalidades',
    'user_sessions',
    'clubes',
    'clube_licencas',
    'migration_history'
  ];

  try {
    // Check which tables exist
    const existingTablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    // Get migration status
    const migrationStatus = await getMigrationStatus();

    return {
      isUpToDate: missingTables.length === 0 && migrationStatus.failedMigrations === 0,
      missingTables,
      migrationStatus
    };
  } catch (error) {
    throw new Error(`Failed to verify database schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a manual migration (for emergency situations)
 * Use with extreme caution - this bypasses normal migration tracking
 */
export async function executeManualMigration(
  migrationName: string,
  migrationSql: string
): Promise<{ success: boolean; executionTime: number; error?: string }> {
  const startTime = Date.now();

  return await transaction(async (client: PoolClient) => {
    try {
      // Execute the migration SQL
      await client.query(migrationSql);

      const executionTime = Date.now() - startTime;
      const contentHash = require('crypto')
        .createHash('sha256')
        .update(migrationSql, 'utf8')
        .digest('hex');

      // Record the execution
      await client.query(`
        INSERT INTO migration_history 
        (migration_name, execution_time_ms, migration_content_hash, status) 
        VALUES ($1, $2, $3, 'success')
      `, [migrationName, executionTime, contentHash]);

      return { success: true, executionTime };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return { success: false, executionTime, error: errorMessage };
    }
  });
}

/**
 * Database health check that includes migration status
 */
export async function databaseHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    version?: string;
    currentTime?: string;
  };
  migrations: {
    isUpToDate: boolean;
    totalMigrations: number;
    failedMigrations: number;
    lastMigrationAt?: string;
  };
  schema: {
    isComplete: boolean;
    missingTables: string[];
  };
}> {
  try {
    // Test database connection
    const dbResult = await query('SELECT NOW() as current_time, version() as version');
    const dbInfo = dbResult.rows[0];

    // Check schema status
    const schemaStatus = await verifyDatabaseSchema();

    const healthStatus = {
      status: 'healthy' as const,
      database: {
        connected: true,
        version: dbInfo.version.split(' ').slice(0, 2).join(' '),
        currentTime: dbInfo.current_time
      },
      migrations: {
        isUpToDate: schemaStatus.migrationStatus.failedMigrations === 0,
        totalMigrations: schemaStatus.migrationStatus.totalMigrations,
        failedMigrations: schemaStatus.migrationStatus.failedMigrations,
        lastMigrationAt: schemaStatus.migrationStatus.lastMigrationAt
      },
      schema: {
        isComplete: schemaStatus.isUpToDate,
        missingTables: schemaStatus.missingTables
      }
    };

    // Determine overall health status
    if (schemaStatus.migrationStatus.failedMigrations > 0 || !schemaStatus.isUpToDate) {
      healthStatus.status = 'degraded';
    }

    return healthStatus;

  } catch (error) {
    return {
      status: 'unhealthy',
      database: {
        connected: false
      },
      migrations: {
        isUpToDate: false,
        totalMigrations: 0,
        failedMigrations: 0
      },
      schema: {
        isComplete: false,
        missingTables: []
      }
    };
  }
}

/**
 * Wait for database migrations to complete (useful for application startup)
 */
export async function waitForMigrations(
  maxWaitTimeMs: number = 30000,
  checkIntervalMs: number = 1000
): Promise<{ success: boolean; elapsedTime: number }> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    try {
      const healthCheck = await databaseHealthCheck();
      
      if (healthCheck.status === 'healthy') {
        return { success: true, elapsedTime: Date.now() - startTime };
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      
    } catch (error) {
      // Continue waiting if there's an error
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }
  }
  
  return { success: false, elapsedTime: Date.now() - startTime };
}

export default {
  getMigrationStatus,
  isMigrationExecuted,
  verifyDatabaseSchema,
  executeManualMigration,
  databaseHealthCheck,
  waitForMigrations
};