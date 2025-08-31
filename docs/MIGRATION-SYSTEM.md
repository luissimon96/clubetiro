# Database Migration Runner System

## Overview

This document describes the comprehensive database migration system implemented for Clube de Tiro. The system provides automatic, reliable, and trackable database schema management integrated with the Docker development workflow.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│               Docker Container                  │
├─────────────────────────────────────────────────┤
│  1. Container starts                            │
│  2. docker-entrypoint.sh runs                  │
│  3. Wait for database (with retry)             │
│  4. Run migration script                       │
│  5. Start Nuxt.js application                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Migration System                   │
├─────────────────────────────────────────────────┤
│  • Discover migration files                    │
│  • Check execution status                      │
│  • Execute in transaction                      │
│  • Track in migration_history table           │
│  • Verify integrity with SHA256 hashes        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            Health Check System                  │
├─────────────────────────────────────────────────┤
│  • Database connectivity                       │
│  • Migration status                            │
│  • Schema completeness                         │
│  • Connection pool statistics                  │
└─────────────────────────────────────────────────┘
```

## Files Created/Modified

### Core Migration System
- `scripts/migrate.js` - Main migration runner with comprehensive error handling
- `scripts/docker-entrypoint.sh` - Docker startup script with database waiting
- `scripts/test-migrations.js` - Test suite for migration system validation
- `utils/migrate.ts` - TypeScript utilities for migration management
- `server/api/health.get.ts` - Enhanced health check endpoint
- `server/api/admin/migrations.get.ts` - Admin migration status endpoint

### Migration Files
- `database/migrations/001-initial-schema.sql` - Complete initial database schema
- `database/migrations/002-user-hierarchy-preparation.sql` - User hierarchy preparation
- `database/migrations/003-add-member-fields.sql` - Member tracking fields (existing)
- `database/migrations/004-create-clubes-hierarchy.sql` - Club hierarchy system (existing)
- `database/migrations/004-fix-hierarchy.sql` - Hierarchy fixes (existing)

### Configuration Updates
- `package.json` - Added migration and test scripts
- `Dockerfile.dev` - Updated with migration support and enhanced health checks
- `docker-compose.yml` - Added database volume mounting

### Documentation
- `database/migrations/README.md` - Comprehensive migration system documentation
- `MIGRATION-SYSTEM.md` - This system overview document

## Key Features

### ✅ Automatic Execution
- **Container Startup Integration**: Migrations run automatically during Docker container initialization
- **Database Readiness**: Waits for PostgreSQL to be ready before attempting migrations
- **Proper Ordering**: Executes migrations in numerical order (001, 002, 003, etc.)
- **Skip Executed**: Only runs new or previously failed migrations

### ✅ Comprehensive Tracking
- **Migration History**: Complete execution history in `migration_history` table
- **Integrity Verification**: SHA256 hashing prevents accidental content changes
- **Execution Metrics**: Tracks execution time and status for each migration
- **Error Details**: Stores detailed error messages for failed migrations

### ✅ Robust Error Handling
- **Transaction Safety**: Each migration runs in its own transaction with rollback support
- **Retry Logic**: Database connection retries with exponential backoff
- **Graceful Failures**: Proper exit codes for container orchestration
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

### ✅ Health Check Integration
- **Container Health**: Docker health checks include migration status
- **API Endpoints**: REST endpoints for monitoring migration status
- **Schema Validation**: Automatic verification of expected database structure
- **Performance Metrics**: Connection pool and execution time monitoring

### ✅ Development Workflow
- **Hot Reload Support**: Migrations run before development server starts
- **Test Integration**: Comprehensive test suite for validation
- **Manual Controls**: Scripts for manual migration execution and testing
- **Admin Interface**: Admin API for detailed migration management

## Usage Examples

### Container Startup (Automatic)
```bash
# Start development environment (migrations run automatically)
docker-compose up

# Force rebuild and restart
docker-compose up --build --force-recreate
```

### Manual Migration Management
```bash
# Run pending migrations
npm run migrate

# Check migration health
npm run migrate:health

# Test migration system
npm run migrate:test

# Start with migrations then development server
npm run dev:migrate
```

### Health Check Endpoints
```bash
# Basic health check (includes migration status)
curl http://localhost:3000/api/health

# Detailed migration status (admin only)
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/admin/migrations
```

### Docker Health Checks
```bash
# Check container health
docker ps  # Shows health status in status column

# Manual health check
docker exec clube-tiro-nuxt-dev ./scripts/docker-entrypoint.sh health
```

## Migration File Examples

### Basic Migration Structure
```sql
-- Migration: Add user preferences
-- Date: 2025-08-31
-- Description: Add user preference storage table

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

COMMIT;
```

### Safe Column Addition
```sql
-- Migration: Add phone number to users
-- Date: 2025-08-31
-- Description: Add phone number field for user communication

-- Add column as nullable first
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Set default values if needed
UPDATE users SET phone = '' WHERE phone IS NULL;

COMMIT;
```

## Monitoring and Troubleshooting

### Health Status Interpretation
- **healthy**: All migrations successful, schema complete
- **degraded**: Some migrations failed or schema incomplete, but app functional
- **unhealthy**: Database connectivity issues or critical failures

### Common Issues and Solutions

**Issue: Container fails to start due to migration failure**
```bash
# Check logs for migration error details
docker logs clube-tiro-nuxt-dev

# Check database connectivity
docker exec clube-tiro-postgres pg_isready -U clube_tiro_user

# Verify migration files syntax
cat database/migrations/NNN-problematic-migration.sql
```

**Issue: Migration marked as failed but should be successful**
```sql
-- Connect to database and update status
UPDATE migration_history 
SET status = 'success', error_message = NULL 
WHERE migration_name = 'failed-migration-name';
```

**Issue: Need to reset migration system (DEVELOPMENT ONLY)**
```sql
-- Clear migration history
DROP TABLE IF EXISTS migration_history;
-- Restart container to re-run all migrations
```

### Performance Monitoring
- Monitor migration execution times via `migration_history.execution_time_ms`
- Track connection pool usage via health check endpoint
- Set up alerts for failed migrations in production

## Security Considerations

### Access Control
- Migration scripts run with database user privileges
- Admin migration API requires system administrator authentication
- Health check endpoints provide limited information to unauthorized users

### Data Safety
- All migrations run in transactions with rollback capability
- Content integrity verification prevents accidental changes
- Migration history provides audit trail for compliance

### Production Deployment
- Always backup database before running migrations in production
- Test migrations on production-like data first
- Use database maintenance windows for major schema changes
- Monitor migration execution and have rollback procedures ready

## Testing Strategy

### Automated Testing
```bash
# Run migration system tests
npm run migrate:test

# Output includes:
# ✅ CONNECTION: PASS
# ✅ TRACKING: PASS  
# ✅ DISCOVERY: PASS
# ✅ SCHEMA: PASS
# ✅ HEALTHCHECK: PASS
```

### Manual Testing
1. Start fresh database container
2. Verify migrations run automatically
3. Check health endpoints respond correctly
4. Verify schema matches expectations
5. Test migration failure scenarios

### Integration Testing
- Health checks integrated with container orchestration
- Migration status included in application monitoring
- Database schema validation in CI/CD pipeline

## Future Enhancements

### Planned Features
- **Migration Rollback**: Implement down migrations for schema rollbacks
- **Parallel Execution**: Run independent migrations in parallel for performance
- **Schema Diff**: Automatic detection of schema drift
- **Migration Templates**: Code generation for common migration patterns
- **Dry Run Mode**: Preview migration execution without applying changes

### Production Optimizations
- **Blue/Green Deployments**: Zero-downtime migration strategies
- **Database Sharding**: Multi-database migration support
- **Cloud Integration**: AWS RDS, Google Cloud SQL migration support
- **Monitoring Integration**: Prometheus metrics and Grafana dashboards

---

This migration system provides a robust, reliable, and maintainable approach to database schema management for the Clube de Tiro application. The system is designed to work seamlessly with Docker development workflows while providing the safety and monitoring capabilities needed for production deployments.