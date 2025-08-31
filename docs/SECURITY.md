# Security Configuration for Clube de Tiro Development Environment

## Overview

This document outlines the security measures implemented in the development Docker configuration to protect against common container vulnerabilities while maintaining development workflow efficiency.

## Security Implementations

### 1. Non-Root User Execution
- **Container User**: `nodejs` (UID: 1001, GID: 1001)
- **Benefit**: Prevents privilege escalation attacks
- **Development Impact**: Volume mounts configured for user compatibility

### 2. Capability Restrictions
- **Dropped**: ALL capabilities by default
- **Added**: Only essential capabilities (CHOWN, DAC_OVERRIDE, SETGID, SETUID)
- **Benefit**: Minimal attack surface, prevents kernel exploits

### 3. Resource Limits
- **Memory**: 1GB limit prevents memory-based DoS
- **PIDs**: 100 process limit prevents fork bombs
- **Shared Memory**: 64MB limit for /dev/shm

### 4. File System Security
- **Read-only Mounts**: Configuration files mounted as read-only
- **Permission Control**: Secure file permissions (750 for scripts, 755 for directories)
- **Isolated Volumes**: Build artifacts in separate Docker volumes

### 5. Network Security
- **Port Exposure**: Only port 3000 exposed
- **Network Isolation**: Custom bridge network with subnet control
- **Internal Services**: Database and Redis not directly exposed

### 6. Secret Management
- **Environment Isolation**: Development secrets clearly marked
- **Secure Generation**: OpenSSL-based secret generation
- **File Permissions**: .env files restricted to 600 permissions

## Security Scripts

### Setup Script
```bash
npm run security:setup
```
- Creates volume directories with proper permissions
- Validates Docker security configuration
- Generates secure development secrets
- Checks for sensitive files in repository

### Validation Script
```bash
npm run security:validate
```
- Tests container security posture
- Validates user permissions and capabilities
- Checks file system security
- Generates security score and report

### Security Audit
```bash
npm run security:audit
```
- Scans dependencies for known vulnerabilities
- Reports security issues in installed packages
- Provides remediation recommendations

### Container Scanning
```bash
npm run security:scan
```
- Scans container image for vulnerabilities
- Generates SARIF security report
- Identifies base image security issues

## Development Workflow

### Secure Startup
```bash
# Option 1: Quick secure start
npm run dev:secure

# Option 2: Manual setup
npm run security:setup
docker-compose up --build
```

### Ongoing Security
```bash
# Weekly security validation
npm run security:validate

# Monthly dependency audit
npm run security:audit
npm run security:fix

# Before production deployment
npm run security:scan
```

## Security Considerations

### Development vs Production
- **Development**: Relaxed CORS, longer JWT expiration, detailed logging
- **Production**: Strict security headers, short sessions, minimal logging
- **Transition**: Environment-based configuration switching

### Volume Mount Security
- **Source Code**: Delegated mounts for hot-reload performance
- **Configuration**: Read-only mounts prevent accidental modification
- **Build Artifacts**: Isolated Docker volumes prevent host contamination

### Container Isolation
- **Process Isolation**: Non-root user prevents host compromise
- **File System**: Limited write access and secure permissions
- **Network**: Controlled port exposure and subnet isolation

## Threat Model

### Mitigated Risks
- ✅ **Container Escape**: Non-root user + capability restrictions
- ✅ **Privilege Escalation**: no-new-privileges security option
- ✅ **Resource Exhaustion**: Memory and PID limits
- ✅ **File System Attacks**: Read-only mounts + secure permissions
- ✅ **Network Attacks**: Limited port exposure + subnet control

### Accepted Development Risks
- ⚠️ **Volume Mount Access**: Required for hot-reload functionality
- ⚠️ **Debug Capabilities**: Needed for development debugging
- ⚠️ **Relaxed CORS**: Allows local development

### Monitoring Required
- 🔍 **Dependency Vulnerabilities**: Regular npm audit
- 🔍 **Container Image**: Periodic security scanning
- 🔍 **Runtime Behavior**: Container resource monitoring

## Compliance

### Security Standards
- **OWASP Container Security**: Non-root execution, minimal capabilities
- **CIS Docker Benchmark**: User namespace, read-only mounts
- **NIST Cybersecurity Framework**: Identify, Protect, Detect controls

### Best Practices Implemented
- Least privilege principle
- Defense in depth strategy
- Secure by default configuration
- Regular security validation

## Troubleshooting

### Permission Issues
```bash
# If volume mounts fail due to permissions
sudo chown -R 1001:1001 volumes/
chmod 755 volumes/postgres volumes/redis
```

### Container Build Issues
```bash
# Rebuild with security validation
docker-compose down
docker-compose build --no-cache
npm run security:validate
```

### Security Test Failures
```bash
# Run detailed security validation
npm run security:validate
# Check specific test failures and remediate
```

## Security Contacts

For security issues or questions:
- Development Team: Review this documentation
- Security Concerns: Follow responsible disclosure practices
- Production Deployment: Additional security hardening required

---

**Security Philosophy**: Security is not optional in development. These measures protect both the development environment and prepare for secure production deployment.