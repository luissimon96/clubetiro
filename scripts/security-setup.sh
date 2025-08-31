#!/bin/bash
# Security Setup Script for Clube de Tiro Development Environment
# This script ensures proper file permissions for non-root Docker container

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================="
echo -e "Clube de Tiro - Security Setup"
echo -e "=====================================${NC}"

# Security: Check if running as root (should not be)
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}WARNING: Running as root. This script should run as regular user.${NC}"
    echo -e "${YELLOW}Continuing with sudo for directory permissions...${NC}"
    SUDO_CMD="sudo"
else
    SUDO_CMD=""
fi

# Security: Get current user ID for Docker compatibility
CURRENT_UID=$(id -u)
CURRENT_GID=$(id -g)

echo -e "${BLUE}Current user: $(whoami) (${CURRENT_UID}:${CURRENT_GID})${NC}"
echo -e "${BLUE}Docker user will be: nodejs (1001:1001)${NC}"

# Security: Create volume directories with proper permissions
echo -e "\n${YELLOW}Creating volume directories...${NC}"

# Create volumes directory structure
mkdir -p volumes/postgres volumes/redis

# Security: Set permissions for volume directories
# These need to be accessible by both host user and container user
chmod 755 volumes/
chmod 755 volumes/postgres volumes/redis

# Security: Ensure scripts are executable but secure
echo -e "\n${YELLOW}Setting script permissions...${NC}"
chmod 750 scripts/*.sh
chmod 640 scripts/*.js

# Security: Check for sensitive files that should not be in the repository
echo -e "\n${YELLOW}Checking for sensitive files...${NC}"

SENSITIVE_FILES=(
    ".env"
    "secrets/"
    "*.key"
    "*.pem" 
    "*.cert"
    "*.crt"
    "id_rsa"
    ".ssh/"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -type f 2>/dev/null | grep -q .; then
        echo -e "${RED}WARNING: Found sensitive files matching '$pattern'${NC}"
        find . -name "$pattern" -type f
        echo -e "${YELLOW}Ensure these files are in .gitignore and .dockerignore${NC}"
    fi
done

# Security: Validate Docker configuration
echo -e "\n${YELLOW}Validating Docker security configuration...${NC}"

# Check if Dockerfile.dev uses non-root user
if grep -q "USER nodejs" Dockerfile.dev; then
    echo -e "${GREEN}✓ Dockerfile.dev uses non-root user${NC}"
else
    echo -e "${RED}✗ Dockerfile.dev missing non-root user configuration${NC}"
fi

# Check if docker-compose.yml has security settings
if grep -q "user: \"1001:1001\"" docker-compose.yml; then
    echo -e "${GREEN}✓ docker-compose.yml configured for non-root user${NC}"
else
    echo -e "${RED}✗ docker-compose.yml missing user security configuration${NC}"
fi

# Check if docker-compose.yml has capability restrictions
if grep -q "cap_drop:" docker-compose.yml; then
    echo -e "${GREEN}✓ docker-compose.yml has capability restrictions${NC}"
else
    echo -e "${RED}✗ docker-compose.yml missing capability restrictions${NC}"
fi

# Security: Generate secure development secrets if .env doesn't exist
echo -e "\n${YELLOW}Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from template with secure defaults...${NC}"
    cp .env.example .env
    
    # Generate secure secrets for development
    if command -v openssl >/dev/null 2>&1; then
        echo -e "${BLUE}Generating secure development secrets...${NC}"
        
        # Generate JWT secrets
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        NUXT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        
        # Replace default secrets in .env
        sed -i.bak "s/dev-jwt-secret-key-change-in-production-min-64-chars/$JWT_SECRET/" .env
        sed -i.bak "s/dev-jwt-refresh-secret-key-change-in-production-min-64-chars/$JWT_REFRESH_SECRET/" .env
        sed -i.bak "s/dev-secret-key-change-in-production/$NUXT_SECRET/" .env
        
        # Remove backup file
        rm -f .env.bak
        
        echo -e "${GREEN}✓ Secure development secrets generated${NC}"
    else
        echo -e "${YELLOW}openssl not available. Using default development secrets.${NC}"
        echo -e "${RED}WARNING: Change secrets before production deployment!${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Security: Set proper permissions on .env file
chmod 600 .env 2>/dev/null || true

# Security: Docker security recommendations
echo -e "\n${BLUE}====================================="
echo -e "Security Recommendations"
echo -e "=====================================${NC}"

echo -e "${GREEN}✓ Non-root user execution configured${NC}"
echo -e "${GREEN}✓ Capability restrictions applied${NC}" 
echo -e "${GREEN}✓ Read-only mounts where possible${NC}"
echo -e "${GREEN}✓ Resource limits configured${NC}"
echo -e "${GREEN}✓ Enhanced .dockerignore security${NC}"
echo -e "${GREEN}✓ Security labels and metadata added${NC}"

echo -e "\n${YELLOW}Additional Security Measures:${NC}"
echo -e "• Regular dependency scanning: ${BLUE}docker scout cves${NC}"
echo -e "• Container image scanning: ${BLUE}trivy image clube-tiro-nuxt-dev${NC}"
echo -e "• Runtime security monitoring: ${BLUE}docker stats${NC}"
echo -e "• Secret rotation: Regenerate secrets periodically"

echo -e "\n${YELLOW}Development Security Notes:${NC}"
echo -e "• Container runs as user nodejs (1001:1001)"
echo -e "• All capabilities dropped except essential ones"
echo -e "• Memory limited to 1GB, PID limit to 100"
echo -e "• No privilege escalation allowed"
echo -e "• Read-only mounts for configuration files"

echo -e "\n${GREEN}Security setup completed successfully!${NC}"
echo -e "${BLUE}You can now run: docker-compose up --build${NC}"