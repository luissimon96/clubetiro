# Database Migration System

This directory contains database migrations for the Clube de Tiro application. The migration system automatically runs during container startup and provides comprehensive tracking and rollback capabilities.

## Migration System Features

### ✅ Automatic Execution
- Migrations run automatically on container startup
- Only executes new/failed migrations (no re-runs)
- Proper order execution based on filename numbering

### ✅ Comprehensive Tracking
- Migration history stored in `migration_history` table
- Execution time tracking
- Content integrity verification via SHA256 hashes
- Status tracking (success, failed, rollback)

### ✅ Error Handling & Safety
- Transaction-based execution with rollback support
- Detailed error logging and reporting
- Health check integration for container orchestration
- Graceful failure handling

### ✅ Docker Integration
- Custom entrypoint script handles database waiting
- Health checks verify migration status
- Proper exit codes for container orchestration
- Development and production ready

## File Naming Convention

Migrations must follow the naming pattern:
```
NNN-descriptive-name.sql
```

Where:
- `NNN` is a 3-digit number (001, 002, 003, etc.)
- `descriptive-name` describes what the migration does
- `.sql` extension is required

**Examples:**
- `001-initial-schema.sql`
- `002-user-hierarchy-preparation.sql` 
- `003-add-member-fields.sql`
- `004-create-clubes-hierarchy.sql`

## Migration Structure

Each migration file should:

1. Start with a header comment describing the migration
2. Use proper SQL transactions when needed
3. Include rollback-safe operations (CREATE IF NOT EXISTS, etc.)
4. End with COMMIT if using transactions

**Example Migration:**
```sql
-- Migration: Add user profile fields
-- Date: 2025-08-31
-- Description: Add profile picture and bio fields to users table

-- Add new columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_profile ON users(profile_picture_url) 
WHERE profile_picture_url IS NOT NULL;

COMMIT;
```

## Running Migrations

### Automatic (Docker)
Migrations run automatically when starting the container:

```bash
# Start with Docker Compose (migrations run automatically)
docker-compose up

# Or force rebuild
docker-compose up --build
```

### Manual Execution
You can run migrations manually:

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:health

# Using the script directly
node scripts/migrate.js run
node scripts/migrate.js health
```

### Development Workflow
```bash
# Start with migrations and dev server
npm run dev:migrate
```

## Migration Tracking Table

The system creates a `migration_history` table to track executions:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `migration_name` | VARCHAR(255) | Migration filename without extension |
| `executed_at` | TIMESTAMP | When the migration was executed |
| `execution_time_ms` | INTEGER | Execution time in milliseconds |
| `checksum` | VARCHAR(64) | SHA256 hash for integrity checking |
| `status` | VARCHAR(20) | success, failed, or rollback |
| `error_message` | TEXT | Error details if failed |
| `migration_content_hash` | VARCHAR(64) | Content verification hash |

## Health Check Integration

The migration system provides health endpoints:

### Application Health Check
```
GET /api/health
```

Returns comprehensive status including:
- Database connectivity
- Migration status
- Schema completeness
- Connection pool statistics

### Migration-Specific Status
```
GET /api/admin/migrations
```

Returns detailed migration information (system admin only):
- Individual migration status
- Execution history
- Schema verification
- Missing tables detection

### Docker Health Check
```bash
# Container health check
docker exec <container> ./scripts/docker-entrypoint.sh health

# Or using Docker's built-in health check
docker ps  # Shows health status
```

## Troubleshooting

### Migration Failures

1. **Check migration logs:**
   ```bash
   docker logs clube-tiro-nuxt-dev
   ```

2. **Verify database connectivity:**
   ```bash
   npm run migrate:health
   ```

3. **Check migration status:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Common Issues

**Issue: Migration fails to connect to database**
```
Solution: Ensure PostgreSQL service is healthy before migrations run
Check: docker-compose ps
```

**Issue: Migration content has changed**
```
Solution: Migration content hashes prevent accidental changes
Fix: Create a new migration instead of modifying existing ones
```

**Issue: Database schema incomplete**
```
Solution: Check for failed migrations in migration_history table
Fix: Review error messages and correct migration SQL
```

### Recovery Procedures

**Reset migration history (DANGEROUS - Development only):**
```sql
-- Connect to database and run:
DROP TABLE IF EXISTS migration_history;
-- Then restart container to re-run all migrations
```

**Mark migration as success (Emergency only):**
```sql
-- If you manually fixed a failed migration:
UPDATE migration_history 
SET status = 'success', error_message = NULL 
WHERE migration_name = 'failed-migration-name';
```

## Best Practices

### ✅ DO
- Always test migrations on development first
- Use `IF NOT EXISTS` for creating objects
- Include descriptive comments in migrations
- Verify migrations with health checks
- Create proper indexes for new columns
- Use transactions for multi-step operations

### ❌ DON'T
- Modify existing migration files (create new ones)
- Drop tables without backup strategy
- Use database-specific features without compatibility checks
- Skip testing migration rollback scenarios
- Create migrations that can't be run multiple times safely

## Migration Examples

### Adding a Column
```sql
-- Add nullable column first
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create index if needed
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Set default values if needed
UPDATE users SET phone = '' WHERE phone IS NULL;
```

### Creating a New Table
```sql
-- Create table with proper constraints
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Data Migration
```sql
-- Migrate data safely with error handling
DO $$
BEGIN
    -- Update existing records
    UPDATE users SET status = 'active' WHERE status IS NULL;
    
    -- Log the change
    RAISE NOTICE 'Updated % users with null status', (
        SELECT COUNT(*) FROM users WHERE status = 'active'
    );
END $$;
```

## Production Considerations

### Backup Strategy
- Always backup database before running migrations in production
- Test migrations on production-like data first
- Have rollback plan ready

### Zero-Downtime Migrations
- Add columns as nullable first, populate later
- Create indexes concurrently in PostgreSQL
- Use feature flags for breaking changes

### Monitoring
- Monitor migration execution time
- Set up alerts for failed migrations  
- Track database schema drift

For more information, see the main project documentation or contact the development team.