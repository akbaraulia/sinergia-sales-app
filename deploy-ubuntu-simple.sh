#!/bin/bash

# Ubuntu Simple Deployment Script (No SSL, Direct Access)
# Perfect for testing and development on Ubuntu servers

set -e

echo "🚀 Deploying Sinergia Sales Web to Ubuntu (Simple Mode)..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}✅ Starting simple deployment (no SSL complexity)${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed. Please logout and login again, then re-run this script.${NC}"
    exit 0
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo -e "${GREEN}✅ Docker and Docker Compose ready${NC}"

# Check for port conflicts
echo -e "${BLUE}ℹ️  Checking for port conflicts...${NC}"
if netstat -tuln 2>/dev/null | grep -q ":9080 "; then
    echo -e "${YELLOW}⚠️  Port 9080 is already in use. Stopping existing service...${NC}"
    docker stop $(docker ps -q --filter "publish=9080") 2>/dev/null || true
fi

if netstat -tuln 2>/dev/null | grep -q ":6380 "; then
    echo -e "${YELLOW}⚠️  Port 6380 is already in use. Using internal Redis connection only.${NC}"
else
    echo -e "${GREEN}✅ Ports 9080 and 6380 are available${NC}"
fi

# Create environment file for Ubuntu
echo -e "${BLUE}ℹ️  Creating Ubuntu environment file...${NC}"
cat > .env.ubuntu << EOF
NODE_ENV=production
NEXT_PUBLIC_ERP_ENV=PROD

# Update these with your server IP or domain
NEXT_PUBLIC_API_URL=http://localhost:9080/api
NEXT_PUBLIC_APP_URL=http://localhost:9080

# ERP URLs
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
ERP_DEV_BASE_URL=https://sinergiadev.digitalasiasolusindo.com

# Session config
SESSION_TIMEOUT_MINUTES=60
AUTH_CHECK_INTERVAL_MINUTES=5
COOKIE_MAX_AGE_MINUTES=120

# Redis (using port 6380 to avoid conflicts)
REDIS_URL=redis://redis:6379
EOF

echo -e "${GREEN}✅ Environment file created: .env.ubuntu${NC}"

# Stop any existing containers
echo -e "${BLUE}ℹ️  Stopping existing containers...${NC}"
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Build and start
echo -e "${BLUE}ℹ️  Building and starting containers...${NC}"
docker-compose -f docker-compose.simple.yml up -d --build

# Wait for startup
echo -e "${BLUE}ℹ️  Waiting for services to start...${NC}"
sleep 20

# Health check
echo -e "${BLUE}ℹ️  Performing health check...${NC}"
if curl -f http://localhost:9080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo -e "${GREEN}📱 Application URLs:${NC}"
    echo "   Local: http://localhost:9080"
    echo "   Health: http://localhost:9080/api/health"
    echo ""
    echo -e "${YELLOW}🔧 Server access (update these in .env.ubuntu):${NC}"
    echo "   External: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):9080"
    echo "   Health: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):9080/api/health"
    echo ""
    echo -e "${BLUE}ℹ️  Next steps:${NC}"
    echo "   1. Open firewall: sudo ufw allow 9080"
    echo "   2. Update NEXT_PUBLIC_API_URL in .env.ubuntu with your server IP"
    echo "   3. Restart: docker-compose -f docker-compose.simple.yml restart"
    echo ""
    echo -e "${GREEN}✅ Ready for testing!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Checking logs...${NC}"
    docker-compose -f docker-compose.simple.yml logs
fi
