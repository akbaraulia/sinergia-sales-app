#!/bin/bash

# Test SSH Tunnel Connection for Database Access

echo "🔍 Testing SSH Tunnel Connection for Database Access..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test SSH connection to LIVE server
echo -e "${BLUE}ℹ️  Testing SSH connection to LIVE server (192.168.10.129)...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -i secrets/ssh_private_key root@192.168.10.129 "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ LIVE SSH connection successful${NC}"
else
    echo -e "${RED}❌ LIVE SSH connection failed${NC}"
    echo -e "${YELLOW}   Please check:${NC}"
    echo -e "${YELLOW}   - SSH key exists: secrets/ssh_private_key${NC}"
    echo -e "${YELLOW}   - SSH key permissions: chmod 600 secrets/ssh_private_key${NC}"
    echo -e "${YELLOW}   - Server is accessible${NC}"
    echo -e "${YELLOW}   - SSH key is correct${NC}"
fi

# Test SSH connection to DEV server
echo -e "${BLUE}ℹ️  Testing SSH connection to DEV server (192.168.10.159)...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -i secrets/ssh_private_key root@192.168.10.159 "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ DEV SSH connection successful${NC}"
else
    echo -e "${RED}❌ DEV SSH connection failed${NC}"
    echo -e "${YELLOW}   Please check:${NC}"
    echo -e "${YELLOW}   - SSH key exists: secrets/ssh_private_key${NC}"
    echo -e "${YELLOW}   - SSH key permissions: chmod 600 secrets/ssh_private_key${NC}"
    echo -e "${YELLOW}   - Server is accessible${NC}"
    echo -e "${YELLOW}   - SSH key is correct${NC}"
fi

# Test MySQL connectivity through SSH tunnel (LIVE)
echo -e "${BLUE}ℹ️  Testing MySQL connection through SSH tunnel (LIVE)...${NC}"
# Create SSH tunnel in background
ssh -o ConnectTimeout=10 -i secrets/ssh_private_key -L 13306:127.0.0.1:3306 -N root@192.168.10.129 &
SSH_PID=$!
sleep 3

# Test MySQL connection
if command -v mysql &> /dev/null; then
    if mysql -h 127.0.0.1 -P 13306 -u readonly_user -p1a176bee987852f3e928 -e "SELECT 1;" 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL connection through SSH tunnel successful${NC}"
    else
        echo -e "${RED}❌ MySQL connection through SSH tunnel failed${NC}"
        echo -e "${YELLOW}   Database may not be accessible or credentials incorrect${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MySQL client not installed, skipping database test${NC}"
fi

# Kill SSH tunnel
kill $SSH_PID 2>/dev/null

echo ""
echo -e "${BLUE}ℹ️  SSH Tunnel Configuration for Docker:${NC}"
echo -e "${YELLOW}   - SSH keys will be mounted to: /home/nextjs/.ssh/andrew.unknown${NC}"
echo -e "${YELLOW}   - Database host in container: 127.0.0.1 (localhost)${NC}"
echo -e "${YELLOW}   - SSH tunnel will be established automatically${NC}"
echo ""
echo -e "${GREEN}✅ SSH tunnel test completed${NC}"