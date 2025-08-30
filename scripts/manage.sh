#!/bin/bash
set -euo pipefail

# ========================================
# Clube de Tiro - Management Script
# ========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="clube-tiro"
DEV_COMPOSE="docker-compose.yml"
PROD_COMPOSE="docker-compose.prod.yml"
ENV_FILE=".env"
PROD_ENV_FILE=".env.production"

# Functions
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "[$timestamp] ${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "[$timestamp] ${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "[$timestamp] ${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "[$timestamp] ${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
}

# Help function
show_help() {
    echo -e "${GREEN}🚀 Clube de Tiro Management Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup          Setup initial environment"
    echo "  dev            Start development environment"
    echo "  prod           Start production environment"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  logs           Show logs"
    echo "  status         Show services status"
    echo "  backup         Run backup manually"
    echo "  clean          Clean up containers and volumes"
    echo "  monitoring     Open monitoring dashboard"
    echo "  ssl            Generate SSL certificates"
    echo "  test           Run tests"
    echo "  help           Show this help message"
    echo ""
    echo "Options:"
    echo "  -f, --follow   Follow logs (for logs command)"
    echo "  -d, --detach   Run in background"
    echo "  --prod         Use production configuration"
    echo ""
    echo "Examples:"
    echo "  $0 setup                 # Initial setup"
    echo "  $0 dev                   # Start development"
    echo "  $0 logs -f nuxt-app      # Follow app logs"
    echo "  $0 prod --detach         # Start production in background"
}

# Setup function
setup_environment() {
    log "INFO" "🔧 Setting up environment..."
    
    # Create .env if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log "INFO" "📝 Creating $ENV_FILE from template..."
        cp .env.example "$ENV_FILE"
        log "WARN" "⚠️ Please edit $ENV_FILE with your configurations"
    else
        log "INFO" "✅ $ENV_FILE already exists"
    fi
    
    # Create directories
    log "INFO" "📁 Creating directories..."
    mkdir -p volumes/{backups,logs,postgres-data,redis-data,uploads}
    mkdir -p nginx/ssl
    mkdir -p monitoring/grafana/{dashboards,provisioning}
    
    # Set permissions
    log "INFO" "🔐 Setting permissions..."
    chmod +x scripts/*.sh
    
    # Generate SSL certificates (self-signed for development)
    if [ ! -f "nginx/ssl/clube-tiro.crt" ]; then
        log "INFO" "🔒 Generating self-signed SSL certificates..."
        generate_ssl_cert
    fi
    
    log "INFO" "✅ Environment setup completed!"
}

# Generate SSL certificates
generate_ssl_cert() {
    mkdir -p nginx/ssl
    
    # Generate private key
    openssl genrsa -out nginx/ssl/clube-tiro.key 2048
    
    # Generate certificate
    openssl req -new -x509 -key nginx/ssl/clube-tiro.key -out nginx/ssl/clube-tiro.crt -days 365 -subj "/CN=localhost"
    
    log "INFO" "🔒 SSL certificates generated"
}

# Start development environment
start_dev() {
    log "INFO" "🚀 Starting development environment..."
    
    if [ "$1" = "--detach" ]; then
        docker-compose -f $DEV_COMPOSE up -d
    else
        docker-compose -f $DEV_COMPOSE up
    fi
}

# Start production environment
start_prod() {
    log "INFO" "🚀 Starting production environment..."
    
    # Create production .env if it doesn't exist
    if [ ! -f "$PROD_ENV_FILE" ]; then
        log "WARN" "📝 Creating $PROD_ENV_FILE from template..."
        cp .env.example "$PROD_ENV_FILE"
        log "WARN" "⚠️ Please edit $PROD_ENV_FILE with production configurations"
        return 1
    fi
    
    if [ "$1" = "--detach" ]; then
        docker-compose -f $PROD_COMPOSE --env-file $PROD_ENV_FILE up -d
    else
        docker-compose -f $PROD_COMPOSE --env-file $PROD_ENV_FILE up
    fi
}

# Stop services
stop_services() {
    log "INFO" "🛑 Stopping services..."
    docker-compose -f $DEV_COMPOSE down
    docker-compose -f $PROD_COMPOSE down
}

# Restart services
restart_services() {
    local env=${1:-dev}
    log "INFO" "🔄 Restarting $env services..."
    
    if [ "$env" = "prod" ]; then
        docker-compose -f $PROD_COMPOSE --env-file $PROD_ENV_FILE down
        docker-compose -f $PROD_COMPOSE --env-file $PROD_ENV_FILE up -d
    else
        docker-compose -f $DEV_COMPOSE down
        docker-compose -f $DEV_COMPOSE up -d
    fi
}

# Show logs
show_logs() {
    local service=${1:-}
    local follow=${2:-false}
    local env=${3:-dev}
    
    local compose_file=$DEV_COMPOSE
    local env_file=""
    
    if [ "$env" = "prod" ]; then
        compose_file=$PROD_COMPOSE
        env_file="--env-file $PROD_ENV_FILE"
    fi
    
    if [ "$follow" = "true" ]; then
        if [ -n "$service" ]; then
            docker-compose -f $compose_file $env_file logs -f $service
        else
            docker-compose -f $compose_file $env_file logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose -f $compose_file $env_file logs $service
        else
            docker-compose -f $compose_file $env_file logs
        fi
    fi
}

# Show status
show_status() {
    local env=${1:-dev}
    
    log "INFO" "📊 Showing $env environment status..."
    
    if [ "$env" = "prod" ]; then
        docker-compose -f $PROD_COMPOSE --env-file $PROD_ENV_FILE ps
    else
        docker-compose -f $DEV_COMPOSE ps
    fi
    
    echo ""
    log "INFO" "💾 Docker system usage:"
    docker system df
}

# Run backup
run_backup() {
    log "INFO" "💾 Running backup..."
    
    if docker ps | grep -q clube-tiro-postgres; then
        bash scripts/backup.sh
    else
        log "ERROR" "❌ PostgreSQL container not running"
        return 1
    fi
}

# Clean up
clean_up() {
    log "WARN" "🧹 This will remove all containers, images, and volumes for this project"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "🗑️ Cleaning up..."
        
        # Stop and remove containers
        docker-compose -f $DEV_COMPOSE down -v --remove-orphans
        docker-compose -f $PROD_COMPOSE down -v --remove-orphans
        
        # Remove project images
        docker images | grep $PROJECT_NAME | awk '{print $3}' | xargs -r docker rmi -f
        
        # Remove unused volumes
        docker volume prune -f
        
        # Remove unused networks
        docker network prune -f
        
        log "INFO" "✅ Cleanup completed"
    else
        log "INFO" "❌ Cleanup cancelled"
    fi
}

# Open monitoring dashboard
open_monitoring() {
    log "INFO" "📊 Opening monitoring dashboard..."
    
    # Check if services are running
    if ! docker ps | grep -q grafana; then
        log "ERROR" "❌ Grafana not running. Start production environment first."
        return 1
    fi
    
    log "INFO" "🌐 Monitoring URLs:"
    echo "  Grafana: http://localhost:3001 (admin/admin_change_this)"
    echo "  Prometheus: http://localhost:9090"
    echo "  cAdvisor: http://localhost:8080"
    echo "  Application: https://localhost"
    
    # Try to open browser (works on many systems)
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3001
    elif command -v open > /dev/null; then
        open http://localhost:3001
    elif command -v start > /dev/null; then
        start http://localhost:3001
    fi
}

# Run tests
run_tests() {
    log "INFO" "🧪 Running tests..."
    
    if docker ps | grep -q nuxt-app; then
        docker-compose exec nuxt-app npm run test
    else
        log "ERROR" "❌ Application container not running"
        return 1
    fi
}

# Main script logic
main() {
    local command=${1:-help}
    local option1=${2:-}
    local option2=${3:-}
    local option3=${4:-}
    
    case $command in
        "setup")
            setup_environment
            ;;
        "dev")
            start_dev "$option1"
            ;;
        "prod")
            start_prod "$option1"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            if [ "$option1" = "--prod" ]; then
                restart_services "prod"
            else
                restart_services "dev"
            fi
            ;;
        "logs")
            local follow=false
            local service=""
            local env="dev"
            
            # Parse options
            for arg in "$@"; do
                case $arg in
                    "-f"|"--follow")
                        follow=true
                        ;;
                    "--prod")
                        env="prod"
                        ;;
                    *)
                        if [ "$arg" != "logs" ] && [ "$arg" != "-f" ] && [ "$arg" != "--follow" ] && [ "$arg" != "--prod" ]; then
                            service="$arg"
                        fi
                        ;;
                esac
            done
            
            show_logs "$service" "$follow" "$env"
            ;;
        "status")
            if [ "$option1" = "--prod" ]; then
                show_status "prod"
            else
                show_status "dev"
            fi
            ;;
        "backup")
            run_backup
            ;;
        "clean")
            clean_up
            ;;
        "monitoring")
            open_monitoring
            ;;
        "ssl")
            generate_ssl_cert
            ;;
        "test")
            run_tests
            ;;
        "help"|"--help"|*)
            show_help
            ;;
    esac
}

# Check if running in correct directory
if [ ! -f "docker-compose.yml" ]; then
    log "ERROR" "❌ Please run this script from the project root directory"
    exit 1
fi

# Run main function
main "$@"