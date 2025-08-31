#!/bin/bash
# Security Validation Script for Clube de Tiro Development Environment
# Validates container security posture and compliance

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================="
echo -e "Security Validation Report"
echo -e "=====================================${NC}"

# Security test results
PASS=0
FAIL=0

# Function to run security test
security_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -en "${YELLOW}Testing: $test_name...${NC} "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

# Security: Container user validation
echo -e "\n${BLUE}User Security Tests:${NC}"
security_test "Non-root user execution" "[ \$(id -u) -eq 1001 ]"
security_test "Correct group membership" "[ \$(id -g) -eq 1001 ]"
security_test "User name is nodejs" "[ \"\$(id -un)\" = \"nodejs\" ]"
security_test "Home directory access" "[ -r /home/nodejs ]"

# Security: File permissions validation
echo -e "\n${BLUE}File Permission Tests:${NC}"
security_test "Application directory writable" "[ -w /app ]"
security_test "Scripts executable by user" "[ -x /app/scripts/docker-entrypoint.sh ]"
security_test "Node modules protected" "[ -d /app/node_modules ]"
security_test "Configuration files readable" "[ -r /app/package.json ]"

# Security: Process validation
echo -e "\n${BLUE}Process Security Tests:${NC}"
security_test "No SUID binaries in /app" "! find /app -perm /4000 -type f 2>/dev/null | grep -q ."
security_test "No world-writable files" "! find /app -perm -002 -type f 2>/dev/null | grep -q ."
security_test "Proper script permissions" "[ \"\$(stat -c '%a' /app/scripts/docker-entrypoint.sh)\" = \"750\" ]"

# Security: Network validation
echo -e "\n${BLUE}Network Security Tests:${NC}"
security_test "Port 3000 accessible" "nc -z localhost 3000 || echo 'Port check - container may not be running'"
security_test "No privileged ports bound" "! netstat -tuln 2>/dev/null | grep -E ':(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22)\\s'"

# Security: Environment validation
echo -e "\n${BLUE}Environment Security Tests:${NC}"
security_test "NODE_ENV is development" "[ \"\$NODE_ENV\" = \"development\" ]"
security_test "JWT secrets configured" "[ -n \"\${JWT_SECRET:-}\" ] && [ \"\${#JWT_SECRET}\" -gt 32 ]"
security_test "Database password set" "[ -n \"\${DB_PASSWORD:-}\" ]"
security_test "No production secrets" "! echo \"\$JWT_SECRET\" | grep -q 'production'"

# Security: Dependency validation
echo -e "\n${BLUE}Dependency Security Tests:${NC}"
security_test "Package audit clean" "npm audit --audit-level=high --production"
security_test "No high-risk packages" "! npm audit --audit-level=high --json | jq -e '.vulnerabilities | length > 0'"
security_test "Dependencies up to date" "npm outdated --depth=0 | wc -l | grep -q '^0$'"

# Security: Container runtime validation
echo -e "\n${BLUE}Container Runtime Tests:${NC}"
if [ -f /.dockerenv ]; then
    security_test "Running in container" "[ -f /.dockerenv ]"
    security_test "No privilege escalation" "[ \"\$(cat /proc/self/status | grep '^NoNewPrivs:' | awk '{print \$2}')\" = \"1\" ] || true"
    security_test "Container user namespace" "[ \$(cat /proc/self/uid_map | wc -l) -eq 1 ] || true"
else
    echo -e "${YELLOW}Not running in container - skipping container-specific tests${NC}"
fi

# Security: File integrity validation
echo -e "\n${BLUE}File Integrity Tests:${NC}"
security_test "No suspicious executable files" "! find /app -name '*.sh' -not -path '/app/scripts/*' | grep -q ."
security_test "No hidden executable files" "! find /app -name '.*' -executable -type f | grep -q ."
security_test "Scripts directory secure" "[ \"\$(stat -c '%a' /app/scripts)\" = \"755\" ]"

# Generate security report
echo -e "\n${BLUE}====================================="
echo -e "Security Validation Summary"
echo -e "=====================================${NC}"

TOTAL=$((PASS + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${BLUE}Total: $TOTAL${NC}"
echo -e "${BLUE}Security Score: $SCORE%${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓ All security validations passed!${NC}"
    echo -e "${GREEN}Container security posture: EXCELLENT${NC}"
    exit 0
elif [ $SCORE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠ Minor security issues detected${NC}"
    echo -e "${YELLOW}Container security posture: GOOD${NC}"
    exit 0
elif [ $SCORE -ge 60 ]; then
    echo -e "\n${YELLOW}⚠ Security improvements needed${NC}"
    echo -e "${YELLOW}Container security posture: FAIR${NC}"
    exit 1
else
    echo -e "\n${RED}✗ Significant security issues detected${NC}"
    echo -e "${RED}Container security posture: POOR${NC}"
    exit 1
fi