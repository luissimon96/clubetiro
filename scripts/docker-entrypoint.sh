#!/bin/bash
set -e

# Docker entrypoint script for Clube de Tiro application
# This script runs database migrations before starting the Nuxt.js application

echo "====================================="
echo "Clube de Tiro - Container Startup"
echo "====================================="
echo "Timestamp: $(date)"
echo "Environment: ${NODE_ENV:-development}"
echo "Database Host: ${DB_HOST:-localhost}"
echo "Database Name: ${DB_NAME:-clube_tiro_db}"
echo "Security: Running as user $(id -un) ($(id -u):$(id -g))"
echo "====================================="

# Security: Validate we're running as non-root user
if [ "$(id -u)" -eq 0 ]; then
    echo "ERROR: Container is running as root user. This is a security risk."
    echo "Expected: nodejs user (1001:1001)"
    exit 1
fi

# Security: Validate we have expected user ID
if [ "$(id -u)" -ne 1001 ]; then
    echo "WARNING: Container running as unexpected user ID: $(id -u)"
    echo "Expected: nodejs (1001)"
fi

# Function to prepare development environment
prepare_dev_environment() {
    echo "Preparing development environment..."
    
    # Security: Run postinstall script that was skipped during build
    # This handles native bindings that need to be built at runtime
    if [ ! -f "/app/.postinstall-completed" ]; then
        echo "Running postinstall script for native dependencies..."
        if npm run postinstall 2>/dev/null; then
            echo "✓ Postinstall completed successfully"
            touch /app/.postinstall-completed
        else
            echo "WARNING: Postinstall failed, but continuing (development mode)"
            # In development, we continue even if postinstall fails
            # The application may still work without some optimizations
        fi
    else
        echo "✓ Postinstall already completed"
    fi
    
    # Security: Validate file permissions
    if [ ! -w /app/.nuxt ] 2>/dev/null; then
        echo "Creating .nuxt directory with proper permissions..."
        mkdir -p /app/.nuxt /app/.output
        chmod 750 /app/.nuxt /app/.output
    fi
}

# Function to wait for database to be ready
wait_for_database() {
    echo "Waiting for database to be ready..."
    
    # Maximum wait time in seconds
    MAX_WAIT=60
    WAIT_INTERVAL=2
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # Try to connect to the database
        if node -e "
        import pg from 'pg';
        const { Pool } = pg;
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'clube_tiro_db',
            user: process.env.DB_USER || 'clube_tiro_user',
            password: process.env.DB_PASSWORD,
            connectionTimeoutMillis: 3000
        });
        pool.query('SELECT 1').then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
        " 2>/dev/null; then
            echo "Database is ready!"
            return 0
        fi
        
        echo "Database not ready yet. Waiting ${WAIT_INTERVAL}s... (${ELAPSED}s elapsed)"
        sleep $WAIT_INTERVAL
        ELAPSED=$((ELAPSED + WAIT_INTERVAL))
    done
    
    echo "ERROR: Database failed to become ready within ${MAX_WAIT} seconds"
    exit 1
}

# Function to run database migrations
run_migrations() {
    echo "Starting database migration process..."
    
    # Check if migration script exists
    if [ ! -f "/app/scripts/migrate.js" ]; then
        echo "ERROR: Migration script not found at /app/scripts/migrate.js"
        exit 1
    fi
    
    # Run migrations with proper error handling
    if node /app/scripts/migrate.js run; then
        echo "Database migrations completed successfully"
        
        # Run health check to verify migration status
        echo "Verifying migration status..."
        node /app/scripts/migrate.js health
        
    else
        echo "ERROR: Database migration failed"
        exit 1
    fi
}

# Function to start the application
start_application() {
    echo "Starting Nuxt.js application..."
    echo "Command: $@"
    echo "====================================="
    
    # Execute the original command
    exec "$@"
}

# Function to handle graceful shutdown
cleanup() {
    echo ""
    echo "Received shutdown signal. Performing cleanup..."
    
    # Kill any background processes
    jobs -p | xargs -r kill
    
    echo "Cleanup completed. Shutting down."
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGTERM SIGINT

# Main execution flow
main() {
    # Security: Validate runtime environment
    echo "Security: Validating runtime environment..."
    echo "User: $(id -un) ($(id -u):$(id -g))"
    echo "Working directory: $(pwd)"
    echo "File permissions: $(ls -la /app | head -2)"
    
    # Step 1: Prepare development environment
    prepare_dev_environment
    
    # Step 2: Wait for database to be ready
    wait_for_database
    
    # Step 3: Run database migrations
    run_migrations
    
    # Step 4: Start the application
    start_application "$@"
}

# Health check endpoint for container orchestration
if [ "$1" = "health" ] || [ "$1" = "healthcheck" ]; then
    echo "Running health check..."
    
    # Security: Validate user context in health check
    if [ "$(id -u)" -eq 0 ]; then
        echo "✗ Health check failed: Running as root user"
        exit 1
    fi
    
    if [ "$(id -u)" -ne 1001 ]; then
        echo "⚠ Health check warning: Unexpected user ID $(id -u)"
    fi
    
    # Check database connectivity
    if ! node -e "
    import pg from 'pg';
    const { Pool } = pg;
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'clube_tiro_db',
        user: process.env.DB_USER || 'clube_tiro_user',
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 3000
    });
    pool.query('SELECT 1').then(() => {
        console.log('✓ Database connection: OK');
        process.exit(0);
    }).catch((err) => {
        console.log('✗ Database connection: FAILED -', err.message);
        process.exit(1);
    });
    " 2>/dev/null; then
        echo "✗ Health check failed"
        exit 1
    fi
    
    # Check migration status
    if [ -f "/app/scripts/migrate.js" ]; then
        echo "✓ Migration script: OK"
        node /app/scripts/migrate.js health
    else
        echo "✗ Migration script: NOT FOUND"
        exit 1
    fi
    
    echo "✓ Health check passed"
    exit 0
fi

# Run main function with all arguments
main "$@"