/**
 * Migration Management API Endpoint (Admin Only)
 * 
 * Provides detailed migration status and management capabilities
 * for system administrators.
 */

import { requireSystemAdmin } from '~/server/utils/auth';
import { getMigrationStatus, verifyDatabaseSchema } from '~/utils/migrate';

export default defineEventHandler(async (event) => {
  try {
    // Require system admin authentication
    const user = await requireSystemAdmin(event);
    
    const startTime = Date.now();
    
    // Get comprehensive migration status
    const migrationStatus = await getMigrationStatus();
    
    // Verify database schema
    const schemaStatus = await verifyDatabaseSchema();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      requestedBy: {
        userId: user.userId,
        userType: user.userType
      },
      
      summary: {
        totalMigrations: migrationStatus.totalMigrations,
        successfulMigrations: migrationStatus.successfulMigrations,
        failedMigrations: migrationStatus.failedMigrations,
        lastMigrationAt: migrationStatus.lastMigrationAt,
        schemaComplete: schemaStatus.isUpToDate,
        missingTables: schemaStatus.missingTables
      },
      
      migrations: migrationStatus.migrations.map(migration => ({
        name: migration.migrationName,
        executedAt: migration.executedAt,
        executionTime: `${migration.executionTimeMs}ms`,
        status: migration.status,
        error: migration.errorMessage || null,
        hash: migration.migrationContentHash.substring(0, 8) + '...'
      })),
      
      schema: {
        isComplete: schemaStatus.isUpToDate,
        missingTables: schemaStatus.missingTables,
        expectedTables: [
          'users',
          'eventos', 
          'participantes',
          'resultados',
          'mensalidades',
          'user_sessions',
          'clubes',
          'clube_licencas',
          'migration_history'
        ]
      }
    };
    
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw authentication/authorization errors
      throw error;
    }
    
    console.error('Migration status API error:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao obter status das migrações',
      data: {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    });
  }
});