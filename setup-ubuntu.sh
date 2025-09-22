#!/bin/bash

# Ubuntu Server Deployment Script for Sinergia Sales Web
# This script sets up SSL certificates for production deployment

set -e

echo "🚀 Setting up Sinergia Sales Web for Ubuntu Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on Ubuntu
if [[ ! -f /etc/os-release ]] || ! grep -q "ubuntu" /etc/os-release; then
    print_warning "This script is designed for Ubuntu. Proceed with caution on other systems."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_info "Install Docker: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_info "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Create SSL directory
SSL_DIR="nginx/ssl"
mkdir -p "$SSL_DIR"
print_status "Created SSL directory: $SSL_DIR"

# Function to generate development SSL certificate
generate_dev_ssl() {
    print_info "Generating self-signed SSL certificate for development..."
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Sinergia/OU=Development/CN=localhost"
    
    print_status "Development SSL certificate generated"
    print_warning "This is a self-signed certificate. Browsers will show security warnings."
}

# Function to setup Let's Encrypt SSL (production)
setup_letsencrypt() {
    local domain=$1
    
    print_info "Setting up Let's Encrypt SSL for domain: $domain"
    
    # Install certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        print_info "Installing certbot..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    # Generate certificate
    print_info "Generating Let's Encrypt certificate..."
    print_warning "Make sure your domain points to this server and ports 80/443 are open"
    
    sudo certbot certonly --standalone -d "$domain" --non-interactive --agree-tos --email admin@"$domain"
    
    # Copy certificates to nginx directory
    sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set proper permissions
    sudo chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
    sudo chmod 644 "$SSL_DIR/cert.pem"
    sudo chmod 600 "$SSL_DIR/key.pem"
    
    print_status "Let's Encrypt SSL certificate configured"
}

# Ask user for SSL setup type
echo ""
echo "🔐 SSL Certificate Setup Options:"
echo "1) Development (self-signed certificate)"
echo "2) Production (Let's Encrypt - requires domain)"
echo "3) Skip SSL setup (manual configuration)"
echo ""
read -p "Choose option (1-3): " ssl_option

case $ssl_option in
    1)
        generate_dev_ssl
        ;;
    2)
        read -p "Enter your domain name (e.g., sinergia.yourdomain.com): " domain
        if [[ -z "$domain" ]]; then
            print_error "Domain name is required for Let's Encrypt"
            exit 1
        fi
        setup_letsencrypt "$domain"
        ;;
    3)
        print_warning "SSL setup skipped. Please configure certificates manually."
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

# Create production environment file
print_info "Creating production environment configuration..."

cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_ERP_ENV=PROD

# Server URLs (update these for your server)
NEXT_PUBLIC_API_URL=https://localhost:9443/api
NEXT_PUBLIC_APP_URL=https://localhost:9443

# ERP Configuration
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
ERP_DEV_BASE_URL=https://sinergiadev.digitalasiasolusindo.com

# Session Configuration
SESSION_TIMEOUT_MINUTES=60
AUTH_CHECK_INTERVAL_MINUTES=5
COOKIE_MAX_AGE_MINUTES=120

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

print_status "Created .env.production file"

# Create production docker-compose override
print_info "Creating production docker-compose override..."

cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  sinergia-web:
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL:-https://localhost:9443/api}
      - NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL:-https://localhost:9443}
    env_file:
      - .env.production
    restart: always
    
  nginx:
    restart: always
    
  redis:
    restart: always
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf --appendonly yes

volumes:
  redis_data:
    driver: local
EOF

print_status "Created docker-compose.prod.yml"

# Create nginx production config
print_info "Creating production nginx configuration..."

mkdir -p nginx
cat > nginx/nginx.prod.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream for Next.js
    upstream nextjs_backend {
        server sinergia-web:3000;
        keepalive 32;
    }

    # HTTP to HTTPS Redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # Main HTTPS Server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://nextjs_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://nextjs_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints with stricter rate limiting
        location ~* ^/api/(auth|login) {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://nextjs_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /api/health {
            proxy_pass http://nextjs_backend;
            access_log off;
        }
    }
}
EOF

print_status "Created production nginx configuration"

# Create deployment script
print_info "Creating deployment script..."

cat > deploy-ubuntu.sh << 'EOF'
#!/bin/bash

# Production deployment script for Ubuntu

set -e

echo "🚀 Deploying Sinergia Sales Web to production..."

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Build new images
echo "🔨 Building new images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Start services
echo "▶️  Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f -k https://localhost:9443/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is healthy."
else
    echo "❌ Health check failed. Please check logs:"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📱 Application: https://localhost:9443"
echo "❤️  Health check: https://localhost:9443/api/health"
EOF

chmod +x deploy-ubuntu.sh
print_status "Created deployment script: deploy-ubuntu.sh"

# Final instructions
echo ""
print_status "🎉 Ubuntu server setup completed!"
echo ""
print_info "📋 Next steps:"
echo "1. Transfer these files to your Ubuntu server"
echo "2. Run: chmod +x deploy-ubuntu.sh"
echo "3. Run: ./deploy-ubuntu.sh"
echo ""
print_info "📁 Files created:"
echo "   - .env.production (environment variables)"
echo "   - docker-compose.prod.yml (production overrides)"  
echo "   - nginx/nginx.prod.conf (production nginx config)"
echo "   - deploy-ubuntu.sh (deployment script)"
echo ""
print_info "🔗 Access points:"
echo "   - HTTPS: https://your-server-ip:9443"
echo "   - HTTP: http://your-server-ip:9080 (redirects to HTTPS)"
echo "   - Health: https://your-server-ip:9443/api/health"
echo ""
print_warning "🔒 Security reminders:"
echo "   - Update firewall rules (allow ports 80, 443)"
echo "   - Update domain in environment variables"
echo "   - Use proper SSL certificates for production"
echo "   - Set up monitoring and backups"
echo ""
print_status "Happy deploying! 🚀"
