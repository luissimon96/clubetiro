# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
# Development with Docker (recommended)
docker-compose up                    # Start all services with auto-migrations
docker-compose up --build           # Rebuild and start (use when dependencies change)
docker-compose logs -f nuxt-app     # View application logs in real-time
docker-compose exec nuxt-app bash   # Access application container shell

# Development with npm (requires manual database setup)
npm run dev:migrate                  # Run migrations then start development server
npm run dev                         # Start Nuxt development server only
npm run build                       # Build for production
npm run preview                     # Preview production build

# Database & Migration Management
npm run migrate                      # Run pending database migrations
npm run migrate:health              # Check migration system status
npm run migrate:test                # Test migration system functionality
npm run db:setup                    # Run all migrations (alias for migrate)

# Security & Quality
npm run security:setup              # Configure security settings
npm run security:validate           # Validate security configuration
npm run security:audit              # Run npm security audit
npm run security:scan               # Run Docker security scan (if available)

# Testing & Validation
npm run postinstall                 # Run after npm install (prepares Nuxt)
npx tsc --noEmit                    # TypeScript type checking
```

## Architecture Overview

This is a **Nuxt 3** full-stack application for "Clube de Tiro" (Shooting Club) management with:

### Core Stack
- **Frontend**: Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS
- **Backend**: Nuxt server API routes (server/api/)
- **Database**: PostgreSQL 15 with automated migration system
- **Cache**: Redis (for sessions and performance)
- **Infrastructure**: Docker containers with security-first configuration

### Key Directories
```
├── server/api/                     # Nuxt API routes (REST endpoints)
│   ├── auth/                       # Authentication endpoints
│   ├── admin/                      # Admin-only endpoints
│   ├── system/                     # System management endpoints
│   └── [resources].ts              # CRUD endpoints for main entities
├── database/migrations/            # SQL migration files (auto-executed)
├── utils/                          # Server utilities (database, validation, migration)
├── pages/                          # Vue pages (file-based routing)
├── components/                     # Vue components
├── scripts/                        # Management scripts (migration, security)
└── docker-compose.yml             # Complete development environment
```

### Security Architecture
- **Multi-layered security**: Docker security policies, non-root user execution, capability restrictions
- **JWT Authentication**: Implemented in server/api/auth/ with secure token handling
- **Database Security**: Parameterized queries, transaction-safe operations
- **Container Security**: Runs as non-root user (1001:1001), minimal capabilities

## Database Migration System

The application uses a **sophisticated migration system** that auto-runs during container startup:

### Migration Flow
1. **Container starts** → `scripts/docker-entrypoint.sh`
2. **Wait for database** → Connection retry with exponential backoff
3. **Run migrations** → `scripts/migrate.js` executes pending migrations
4. **Start application** → Nuxt development server

### Migration Files Structure
- Located in `database/migrations/`
- Named with pattern: `NNN-description.sql` (e.g., `001-initial-schema.sql`)
- Executed in numerical order, tracked in `migration_history` table
- **Transaction-safe**: Each migration runs in its own transaction with rollback support

### Migration Commands
```bash
# During development - migrations run automatically with Docker
docker-compose up

# Manual migration control
npm run migrate                 # Run pending migrations
npm run migrate:health         # Check migration status
npm run migrate:test          # Validate migration system

# Health check endpoint includes migration status
curl http://localhost:3000/api/health
```

## API Structure

### Authentication System
- **Login**: `POST /api/auth/login` (email, password)
- **Logout**: `POST /api/auth/logout` 
- **Validate**: `GET /api/auth/validate` (check token validity)
- **JWT tokens**: Server-side generated, stored securely

### Core Resources
All follow RESTful patterns with full CRUD operations:
- **Users**: `/api/users` - Member management
- **Events**: `/api/eventos` - Shooting events/competitions
- **Results**: `/api/resultados` - Competition results
- **Memberships**: `/api/mensalidades` - Membership fee tracking

### System Management
- **Health**: `GET /api/health` - Application health with migration status
- **Clubs**: `/api/system/clubes` - Club hierarchy management
- **Dashboard**: `/api/system/dashboard` - System overview
- **Migrations**: `/api/admin/migrations` - Migration status (admin only)

### Error Handling
- Consistent error response format via `utils/errorHandler.ts`
- HTTP status codes follow REST conventions
- Detailed error logging for development

## Development Workflow

### Starting Development
1. **Copy environment**: `cp .env.example .env` (edit database credentials)
2. **Start services**: `docker-compose up` (auto-runs migrations)
3. **Access application**: http://localhost:3000
4. **View logs**: `docker-compose logs -f nuxt-app`

### Database Development
- **Migrations auto-run** during container startup
- **Schema changes**: Create new migration files in `database/migrations/`
- **Testing migrations**: Use `npm run migrate:test` before committing
- **Database access**: `docker-compose exec postgres psql -U clube_tiro_user -d clube_tiro_db`

### Hot Reload & Development
- **Full hot reload** for all source files
- **Volume mounts** ensure file changes reflect immediately
- **TypeScript checking** enabled in nuxt.config.ts
- **Tailwind CSS** with JIT compilation

### Security Development
- **Security scripts**: Run `npm run security:setup` after environment changes
- **Container security**: All services run as non-root users
- **Audit commands**: `npm run security:audit` for dependency vulnerabilities
- **Docker security**: `npm run security:scan` for container vulnerabilities

## Environment Configuration

### Essential Variables (.env)
```bash
# Database (used by utils/database.ts)
POSTGRES_DB=clube_tiro_db
POSTGRES_USER=clube_tiro_user  
POSTGRES_PASSWORD=secure_password_here

# JWT Authentication (used by server/utils/auth.ts)
JWT_SECRET=your-64-character-jwt-secret-key-here
JWT_REFRESH_SECRET=your-64-character-refresh-secret-here

# Application
NODE_ENV=development
NUXT_SECRET_KEY=your-application-secret-key
```

### Runtime Config Access
Configuration available via Nuxt's `useRuntimeConfig()`:
- **Server-side**: All variables accessible
- **Client-side**: Only `public.*` variables exposed
- **Database**: Accessed via `utils/database.ts` connection pool

## Testing & Quality Assurance

### Health Monitoring
```bash
# Application health (includes migration status)
curl http://localhost:3000/api/health

# Container health
docker ps  # Shows health status in STATUS column

# Migration system health
npm run migrate:health
```

### Database Testing
- **Migration tests**: `npm run migrate:test` validates entire migration system
- **Connection testing**: Health endpoint tests database connectivity
- **Schema validation**: Migration system verifies expected tables exist

### Security Testing
```bash
npm run security:validate      # Validate security configuration
npm run security:audit         # NPM dependency audit
npm run security:scan          # Docker image security scan
```

### Development Debugging
- **API debugging**: Check `server/api/debug/db.ts` for database connection testing
- **Migration debugging**: Migration logs provide detailed execution information
- **Container debugging**: `docker-compose exec nuxt-app bash` for container access

## Production Considerations

### Migration Safety
- **Automatic migrations** run during container startup
- **Transaction safety**: Each migration atomic with rollback capability
- **Integrity checking**: SHA256 hashes prevent accidental content changes
- **Monitoring**: Migration status included in health checks

### Security Hardening
- **Non-root execution**: All containers run with minimal privileges
- **Capability restrictions**: Containers drop unnecessary Linux capabilities
- **Network isolation**: Services communicate through defined Docker network
- **Resource limits**: Memory and PID limits prevent resource exhaustion

### Monitoring & Health
- **Health endpoints**: `/api/health` provides comprehensive system status
- **Migration tracking**: Full audit trail of database changes in `migration_history`
- **Error logging**: Comprehensive logging for debugging and monitoring
- **Performance metrics**: Connection pool statistics and response times

## Common Issues & Solutions

### Container Won't Start
```bash
# Check logs for specific error
docker-compose logs nuxt-app

# Database connection issues
docker-compose logs postgres
docker-compose exec postgres pg_isready

# Migration failures
npm run migrate:health  # Check migration status
```

### Database Issues
```bash
# Reset database (DEVELOPMENT ONLY)
docker-compose down -v  # Removes volumes
docker-compose up       # Recreates with fresh database

# Access database directly
docker-compose exec postgres psql -U clube_tiro_user -d clube_tiro_db
```

### Migration Problems
```bash
# Check migration status
npm run migrate:health

# Test migration system
npm run migrate:test

# Manual migration run
npm run migrate
```

The migration system is designed to be **fault-tolerant** and will automatically retry failed migrations on container restart. The comprehensive health check system provides detailed status information for troubleshooting.