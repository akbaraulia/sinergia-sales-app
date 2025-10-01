#!/bin/bash

# Secure SSH Key Setup for Docker Deployment
# This script helps setup SSH keys securely without committing them to Git

set -e

echo "🔐 Setting up SSH keys securely for Docker deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Create secrets directory if it doesn't exist
mkdir -p secrets

echo -e "${BLUE}ℹ️  SSH Key Setup Options:${NC}"
echo "1. Copy existing SSH key"
echo "2. Generate new SSH key pair"
echo "3. Use environment variable (base64 encoded)"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo -e "${BLUE}ℹ️  Option 1: Copy existing SSH key${NC}"
        echo -e "${YELLOW}⚠️  Please provide the path to your SSH private key:${NC}"
        read -p "SSH key path: " ssh_key_path
        
        if [ -f "$ssh_key_path" ]; then
            cp "$ssh_key_path" secrets/ssh_private_key
            chmod 600 secrets/ssh_private_key
            echo -e "${GREEN}✅ SSH key copied to secrets/ssh_private_key${NC}"
        else
            echo -e "${RED}❌ SSH key not found at: $ssh_key_path${NC}"
            exit 1
        fi
        ;;
    2)
        echo -e "${BLUE}ℹ️  Option 2: Generate new SSH key pair${NC}"
        echo -e "${YELLOW}⚠️  This will generate a new key pair. You'll need to add the public key to your servers.${NC}"
        read -p "Continue? (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            ssh-keygen -t rsa -b 4096 -f secrets/ssh_private_key -N "" -C "docker-deployment"
            echo -e "${GREEN}✅ New SSH key pair generated${NC}"
            echo -e "${YELLOW}📋 Add this public key to your servers:${NC}"
            cat secrets/ssh_private_key.pub
            echo ""
            echo -e "${YELLOW}💡 Command to add to server: ssh-copy-id -i secrets/ssh_private_key.pub root@SERVER_IP${NC}"
        else
            echo "Cancelled."
            exit 1
        fi
        ;;
    3)
        echo -e "${BLUE}ℹ️  Option 3: Use environment variable${NC}"
        echo -e "${YELLOW}💡 You can set SSH_PRIVATE_KEY_BASE64 environment variable${NC}"
        echo -e "${YELLOW}   Example: export SSH_PRIVATE_KEY_BASE64=\$(base64 -w 0 your_key_file)${NC}"
        echo ""
        echo -e "${BLUE}ℹ️  Creating .env.ssh file for environment setup...${NC}"
        
        cat > .env.ssh << EOF
# SSH Private Key (base64 encoded)
# To encode your key: base64 -w 0 your_private_key_file
# SSH_PRIVATE_KEY_BASE64=your_base64_encoded_private_key_here

# Alternative: Use Docker secrets mounting
# Place your SSH private key in: secrets/ssh_private_key
EOF
        
        echo -e "${GREEN}✅ Created .env.ssh template${NC}"
        echo -e "${YELLOW}📝 Edit .env.ssh and add your base64 encoded SSH key${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Update .gitignore to make sure secrets are not committed
echo -e "${BLUE}ℹ️  Updating .gitignore to protect secrets...${NC}"
if ! grep -q "secrets/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Secrets directory" >> .gitignore
    echo "secrets/" >> .gitignore
fi

echo -e "${GREEN}✅ SSH key setup completed securely!${NC}"
echo ""
echo -e "${YELLOW}🔒 Security Notes:${NC}"
echo "   - SSH keys are stored in secrets/ directory (git ignored)"
echo "   - Never commit SSH private keys to Git"
echo "   - Use different keys for different environments if possible"
echo "   - Regularly rotate your SSH keys"
echo ""
echo -e "${BLUE}ℹ️  Next steps:${NC}"
echo "   1. Run deployment script: ./deploy-ubuntu-simple.sh"
echo "   2. Or use Docker directly: docker-compose -f docker-compose.simple.yml up -d --build"