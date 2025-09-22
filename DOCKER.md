# Docker & Container Deployment

This project includes comprehensive Docker setup for both development and production environments.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose available

### Development Mode (with hot reload)
```bash
# Using PowerShell (Windows)
.\deploy.ps1 -Environment development

# Using Bash (Linux/Mac)
./deploy.sh
```

### Production Mode
```bash
# Using PowerShell (Windows)
.\deploy.ps1 -Environment production -Build

# Using Bash (Linux/Mac)
./deploy.sh
```

## 📁 Docker Files Structure

```
├── Dockerfile              # Production Docker image
├── Dockerfile.dev          # Development Docker image
├── docker-compose.yml      # Base compose configuration
├── docker-compose.prod.yml # Production overrides
├── docker-compose.dev.yml  # Development overrides
├── .dockerignore           # Docker ignore file
├── deploy.ps1              # Windows deployment script
├── deploy.sh               # Linux/Mac deployment script
├── generate-ssl.ps1        # Windows SSL certificate generator
├── generate-ssl.sh         # Linux/Mac SSL certificate generator
└── nginx/
    ├── nginx.conf          # Nginx configuration
    └── ssl/                # SSL certificates directory
```

## 🐳 Services

### 1. sinergia-web (Next.js Application)
- **Port**: 3000
- **Environment**: Configurable (development/production)
- **Features**: 
  - Hot reload in development
  - Optimized build in production
  - Health checks
  - Auto-restart

### 2. nginx (Reverse Proxy)
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**:
  - SSL termination
  - Rate limiting
  - Static file caching
  - Security headers
  - Gzip compression

### 3. redis (Session Storage)
- **Port**: 6379
- **Features**:
  - Session management
  - Caching
  - Persistent storage

## 🔧 Configuration

### Environment Variables

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### SSL Certificate

The deployment automatically generates self-signed SSL certificates for development:

```bash
# Windows
.\generate-ssl.ps1

# Linux/Mac
./generate-ssl.sh
```

For production, replace with valid SSL certificates from a trusted CA.

## 🚀 Deployment Commands

### PowerShell (Windows)

```powershell
# Start development environment
.\deploy.ps1

# Start production environment
.\deploy.ps1 -Environment production

# Rebuild and deploy
.\deploy.ps1 -Build

# View logs
.\deploy.ps1 -Logs

# Stop containers
.\deploy.ps1 -Stop
```

### Bash (Linux/Mac)

```bash
# Make scripts executable
chmod +x deploy.sh generate-ssl.sh

# Start development environment
./deploy.sh

# View logs
docker-compose logs -f sinergia-web

# Stop containers
docker-compose down
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Application**: `http://localhost:3000/api/health`
- **Nginx**: `http://localhost/health`

### Container Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs sinergia-web
docker-compose logs nginx
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f sinergia-web
```

### Container Status
```bash
# Check running containers
docker-compose ps

# Check container resource usage
docker stats
```

## 🔒 Security Features

### Nginx Security
- SSL/TLS encryption
- Security headers (XSS protection, CSRF protection)
- Rate limiting for API endpoints
- Login attempt rate limiting

### Application Security
- Environment variable isolation
- Non-root container user
- Minimal attack surface
- Session management with Redis

## 🎯 Production Deployment

### 1. Prepare Environment
```bash
# Copy and modify production environment
cp .env.local .env.production
# Edit .env.production with production values
```

### 2. SSL Certificate
Replace self-signed certificate with valid SSL:
```bash
# Place your SSL certificate files
nginx/ssl/cert.pem    # Your SSL certificate
nginx/ssl/key.pem     # Your private key
```

### 3. Deploy
```bash
# Deploy to production
.\deploy.ps1 -Environment production -Build
```

### 4. Domain Configuration
Update nginx configuration for your domain:
```nginx
server_name your-domain.com www.your-domain.com;
```

## 🛠 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3000

# Stop conflicting services
docker-compose down
```

#### SSL Certificate Issues
```bash
# Regenerate SSL certificate
rm -rf nginx/ssl/*
.\generate-ssl.ps1
```

#### Container Won't Start
```bash
# Check container logs
docker-compose logs sinergia-web

# Rebuild container
docker-compose build --no-cache sinergia-web
```

#### Health Check Failing
```bash
# Check application logs
docker-compose logs sinergia-web

# Test direct connection
curl http://localhost:3000/api/health
```

## 📈 Performance Optimization

### Production Optimizations
- Multi-stage Docker build
- Nginx caching for static assets
- Gzip compression
- Resource limits
- Log rotation

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
```

## 🔄 CI/CD Integration

The Docker setup is ready for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Build and Deploy
  run: |
    docker-compose build
    docker-compose up -d
```

## 📝 Notes

- Development mode includes hot reload for faster development
- Production mode is optimized for performance and security
- SSL certificates are auto-generated for development
- Redis is optional and can be disabled if not needed
- Nginx can be disabled for simple deployments
