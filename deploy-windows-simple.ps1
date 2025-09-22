# Windows Simple Deployment Script (No SSL, Direct Access)
# Perfect for testing and development on Windows machines

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Sinergia Sales Web to Windows (Simple Mode)..." -ForegroundColor Green

Write-Host "✅ Starting simple deployment (no SSL complexity)" -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Desktop with Compose." -ForegroundColor Red
    exit 1
}

# Check for port conflicts
Write-Host "ℹ️  Checking for port conflicts..." -ForegroundColor Blue
$port9080Used = Get-NetTCPConnection -LocalPort 9080 -ErrorAction SilentlyContinue
if ($port9080Used) {
    Write-Host "⚠️  Port 9080 is already in use. Stopping existing Docker containers..." -ForegroundColor Yellow
    try {
        docker stop $(docker ps -q --filter "publish=9080") 2>$null
    } catch {
        # Ignore if no containers found
    }
}

$port6380Used = Get-NetTCPConnection -LocalPort 6380 -ErrorAction SilentlyContinue
if ($port6380Used) {
    Write-Host "⚠️  Port 6380 is already in use. Using internal Redis connection only." -ForegroundColor Yellow
} else {
    Write-Host "✅ Ports 9080 and 6380 are available" -ForegroundColor Green
}

# Create environment file for Windows
Write-Host "ℹ️  Creating Windows environment file..." -ForegroundColor Blue
$envContent = @"
NODE_ENV=production
NEXT_PUBLIC_ERP_ENV=PROD

# Update these with your server IP or domain
NEXT_PUBLIC_API_URL=http://localhost:9080/api
NEXT_PUBLIC_APP_URL=http://localhost:9080

# ERP URLs - Production mode
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
ERP_DEV_BASE_URL=https://sinergiadev.digitalasiasolusindo.com

# Session config
SESSION_TIMEOUT_MINUTES=60
AUTH_CHECK_INTERVAL_MINUTES=5
COOKIE_MAX_AGE_MINUTES=120

# Redis (using port 6380 to avoid conflicts)
REDIS_URL=redis://redis:6379
"@

$envContent | Out-File -FilePath ".env.windows" -Encoding UTF8

Write-Host "✅ Environment file created: .env.windows" -ForegroundColor Green

# Copy environment to .env.local so Docker can read it
Write-Host "ℹ️  Copying environment to .env.local for Docker..." -ForegroundColor Blue
Copy-Item ".env.windows" ".env.local"

Write-Host "✅ Environment copied to .env.local" -ForegroundColor Green

# Stop any existing containers
Write-Host "ℹ️  Stopping existing containers..." -ForegroundColor Blue
try {
    docker-compose -f docker-compose.simple.yml down 2>$null
} catch {
    # Ignore if no containers exist
}

# Build and start
Write-Host "ℹ️  Building and starting containers..." -ForegroundColor Blue
docker-compose -f docker-compose.simple.yml up -d --build --force-recreate

# Wait for startup
Write-Host "ℹ️  Waiting for services to start..." -ForegroundColor Blue
Start-Sleep -Seconds 20

# Health check
Write-Host "ℹ️  Performing health check..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9080/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 Application URLs:" -ForegroundColor Green
        Write-Host "   Local: http://localhost:9080"
        Write-Host "   Health: http://localhost:9080/api/health"
        Write-Host ""
        Write-Host "🔧 External access (update these in .env.windows):" -ForegroundColor Yellow
        try {
            $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
            Write-Host "   External: http://$publicIP`:9080"
            Write-Host "   Health: http://$publicIP`:9080/api/health"
        } catch {
            Write-Host "   External: http://YOUR_PUBLIC_IP:9080"
            Write-Host "   Health: http://YOUR_PUBLIC_IP:9080/api/health"
        }
        Write-Host ""
        Write-Host "ℹ️  Next steps:" -ForegroundColor Blue
        Write-Host "   1. Open Windows Firewall for port 9080 if needed"
        Write-Host "   2. Update NEXT_PUBLIC_API_URL in .env.windows with your server IP"
        Write-Host "   3. Restart: docker-compose -f docker-compose.simple.yml restart"
        Write-Host ""
        Write-Host "✅ Ready for testing!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check failed with status: $($response.StatusCode)" -ForegroundColor Yellow
        docker-compose -f docker-compose.simple.yml logs
    }
} catch {
    Write-Host "⚠️  Health check failed. Checking logs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.simple.yml logs
}
