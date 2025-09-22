# Ubuntu Production Deployment Quick Start

## 🚀 Ready-to-Deploy Files untuk Ubuntu Server

Semua file deployment sudah siap untuk Ubuntu! Ini adalah step-by-step deployment:

### 📋 Step 1: Transfer Files ke Ubuntu Server

```bash
# Di Ubuntu server, clone atau copy files
git clone <your-repo> sinergia-sales-web
cd sinergia-sales-web

# Atau copy manual files yang diperlukan:
# - docker-compose.yml
# - Dockerfile
# - nginx/
# - src/
# - package.json
# - next.config.ts
# - setup-ubuntu.sh
```

### 🔐 Step 2: Setup SSL & Environment

```bash
# Jalankan setup script
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh

# Script akan otomatis:
# ✅ Generate SSL certificates (dev/prod)
# ✅ Create production environment files
# ✅ Setup nginx production config
# ✅ Create deployment script
```

### 🚀 Step 3: Deploy Application

```bash
# Deploy menggunakan script yang sudah dibuat
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh

# Atau manual:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 🔍 Step 4: Verify Deployment

```bash
# Check container status
docker ps

# Test health check
curl -k https://localhost:9443/api/health

# Check logs if needed
docker-compose logs -f
```

---

## 🐳 Alternative: Simple Docker-only Deployment (Recommended untuk testing)

Jika mau test dulu tanpa SSL complexity:

### 1. Disable Nginx sementara

Edit `docker-compose.yml`:
```yaml
services:
  sinergia-web:
    ports:
      - "9080:3000"  # Expose langsung
    environment:
      - NEXT_PUBLIC_API_URL=http://your-server-ip:9080/api
      - NEXT_PUBLIC_APP_URL=http://your-server-ip:9080

  # Comment out nginx service
  # nginx: ...
```

### 2. Deploy Simple Version

```bash
# Di Ubuntu server
docker-compose up -d

# Test
curl http://localhost:9080/api/health
```

### 3. Access dari luar

```bash
# Buka firewall
sudo ufw allow 9080

# Test dari komputer lain
curl http://your-server-ip:9080/api/health
```

---

## 📁 Files yang Sudah Ready:

✅ **docker-compose.yml** - Main configuration  
✅ **Dockerfile** - Production-optimized build  
✅ **setup-ubuntu.sh** - Ubuntu setup automation  
✅ **nginx/nginx.conf** - Production nginx config  
✅ **deploy-ubuntu.sh** - Akan dibuat otomatis oleh setup script  

---

## 🔧 Environment Variables untuk Ubuntu:

Update these in production:
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
```

---

## 🚨 For Production Server:

1. **Firewall**: Allow ports 80, 443 (or 9080, 9443)
2. **Domain**: Point your domain to server IP
3. **SSL**: Use Let's Encrypt (setup script will guide you)
4. **Monitoring**: Setup monitoring and log rotation
5. **Backup**: Setup automatic backup for Redis data

---

## 💡 Quick Commands Reference:

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart sinergia-web

# Check health
curl http://localhost:9080/api/health
```

**Ready untuk deploy ke Ubuntu! 🎉🐧**
