# Sinergia Sales Web - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- SSH private key (`andrew.unknown`) for database access
- Port 9080 available for the application
- Port 6380 available for Redis (optional)

### Development Deployment (Current Setup)

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd sinergia-sales-web-next
   ```

2. **Setup SSH Key for Database Access**
   ```bash
   # Copy your SSH private key to the project directory
   cp /path/to/your/andrew.unknown ./andrew.unknown
   chmod 600 andrew.unknown  # Linux/Mac only
   ```

3. **Test SSH Connection (Optional)**
   ```bash
   # Linux/Mac
   ./test-ssh-tunnel.sh
   
   # Windows
   .\test-ssh-tunnel.ps1
   ```

4. **Deploy Application**
   ```bash
   # Simple deployment (Linux/Mac)
   ./deploy-ubuntu-simple.sh
   
   # Windows with PowerShell
   .\deploy-windows-docker.ps1
   
   # Manual deployment
   docker-compose -f docker-compose.simple.yml up -d --build
   ```

5. **Access Application**
   - Main App: http://localhost:9080
   - Health Check: http://localhost:9080/api/health
   - Redis: localhost:6380

6. **Stop Application**
   ```bash
   docker-compose -f docker-compose.simple.yml down
   ```

## 📋 Current Configuration

### Services Running
- ✅ **Next.js App** (Port 9080) - Main application with SSH tunnel support
- ✅ **Redis** (Port 6380) - Session storage
- ✅ **SSH Tunnel** - Database connectivity through secure tunnel
- ❌ **Nginx** - Disabled (SSL certificate issues)

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Docker Host   │    │   Docker Host   │    │  Remote Servers │
│                 │    │                 │    │                 │
│  Next.js App    │    │     Redis       │    │   Database      │
│  Port: 9080     │    │   Port: 6380    │    │   via SSH       │
│  + SSH Tunnel   │    │                 │    │   Tunnel        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Access
- **SSH Tunnel**: Secure connection to remote MySQL servers
- **Live DB**: 192.168.10.129 → localhost:3306 (in container)
- **Dev DB**: 192.168.10.159 → localhost:3306 (in container)
- **Private Key**: `/home/nextjs/.ssh/andrew.unknown` (mounted from host)

## 🔧 Configuration Details

### Docker Setup
- **Multi-stage Dockerfile** with production optimization
- **Alpine Linux** base for smaller image size
- **Non-root user** for security
- **Health checks** for monitoring

### Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:9080/api
NEXT_PUBLIC_APP_URL=http://localhost:9080
NEXT_PUBLIC_ERP_ENV=PROD
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
ERP_DEV_BASE_URL=https://sinergiadev.digitalasiasolusindo.com
SESSION_TIMEOUT_MINUTES=60
AUTH_CHECK_INTERVAL_MINUTES=5
COOKIE_MAX_AGE_MINUTES=120
REDIS_URL=redis://redis:6379

# SSH Tunnel Configuration
USE_SSH_TUNNEL=true
SSH_LIVE_HOST=192.168.10.129
SSH_LIVE_PORT=22
SSH_LIVE_USER=root
SSH_LIVE_PRIVATE_KEY_PATH=/home/nextjs/.ssh/andrew.unknown
SSH_DEV_HOST=192.168.10.159
SSH_DEV_PORT=22
SSH_DEV_USER=root
SSH_DEV_PRIVATE_KEY_PATH=/home/nextjs/.ssh/andrew.unknown

# Database Configuration (via SSH tunnel)
DB_LIVE_HOST=127.0.0.1
DB_LIVE_PORT=3306
DB_LIVE_USER=readonly_user
DB_LIVE_PASSWORD=1a176bee987852f3e928
DB_LIVE_DATABASE=_3564332c797595cf
DB_DEV_HOST=127.0.0.1
DB_DEV_PORT=3306
DB_DEV_USER=readonly_user
DB_DEV_PASSWORD=1a176bee987852f3e928
DB_DEV_DATABASE=_3e6dae82f3bc05a6
DB_REPORTING_ENV=LIVE
```

## 🛠 Advanced Configuration

### Enable Nginx (Production)
1. **Generate SSL Certificates**
   ```bash
   # For production, replace with real certificates
   openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes
   ```

2. **Uncomment Nginx service** in docker-compose.yml

3. **Update ports** in environment variables to use nginx ports

### Custom Ports
To change ports, update `docker-compose.yml`:
```yaml
services:
  sinergia-web:
    ports:
      - "YOUR_PORT:3000"
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:9080/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-22T07:45:48.716Z",
  "uptime": 12.920988638,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "nextjs": "healthy",
    "database": "healthy",
    "external_apis": "healthy"
  }
}
```

### Container Status
```bash
docker ps
docker logs sinergia-sales-web
docker logs sinergia-redis
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :9080
   # Change port in docker-compose.yml
   ```

2. **SSL Certificate Issues**
   - Current setup runs without SSL
   - For HTTPS, generate proper certificates
   - Update nginx configuration

3. **Health Check Failures**
   ```bash
   # Check if curl is available in container
   docker exec sinergia-sales-web curl http://localhost:3000/api/health
   ```

4. **Build Failures**
   ```bash
   # Clear Docker cache
   docker system prune -a
   # Rebuild without cache
   docker-compose build --no-cache
   ```

## 🔄 Development Workflow

### Local Development
```bash
# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

### Docker Development
```bash
# Build and run
docker-compose up --build

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart sinergia-web
```

## 📁 Project Structure
```
sinergia-sales-web-next/
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Container orchestration
├── nginx/
│   ├── nginx.conf            # Nginx configuration
│   └── ssl/                  # SSL certificates
├── deploy.ps1                # Windows deployment script
├── deploy.sh                 # Linux deployment script
└── src/                      # Next.js application
```

## 🚀 Production Deployment

### Recommended Steps
1. **Setup proper SSL certificates**
2. **Configure environment variables**
3. **Enable nginx reverse proxy**
4. **Setup monitoring and logging**
5. **Configure backup for Redis data**

### Security Considerations
- Use proper SSL certificates (not self-signed)
- Set up firewall rules
- Use environment-specific secrets
- Enable container security scanning
- Regular security updates

## 📞 Support

For issues or questions:
1. Check container logs: `docker logs sinergia-sales-web`
2. Verify health endpoint: `curl http://localhost:9080/api/health`
3. Check Docker status: `docker ps`
4. Review this documentation

---

**Last Updated**: September 22, 2025
**Docker Version**: 27.2.0
**Next.js Version**: 15.5.2
