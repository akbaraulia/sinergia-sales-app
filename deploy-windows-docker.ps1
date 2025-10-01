# Windows Docker Deployment Script
# Perfect for testing and development on Windows with Docker Desktop

param(
    [switch]$Force,
    [string]$Environment = "PROD"
)

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Success "🚀 Deploying Sinergia Sales Web to Windows (Docker)"

# Check Docker Desktop
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Desktop is not running or not installed"
    Write-Info "Please install Docker Desktop and make sure it's running"
    exit 1
}

Write-Success "Docker Desktop is running"

# Check for port conflicts
Write-Info "Checking for port conflicts..."
$port9080 = netstat -an | Select-String ":9080.*LISTENING"
if ($port9080) {
    Write-Warning "Port 9080 is already in use"
    if ($Force) {
        Write-Info "Force flag set, stopping existing containers..."
        docker stop $(docker ps -q --filter "publish=9080") 2>$null
    } else {
        $response = Read-Host "Stop existing service on port 9080? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            docker stop $(docker ps -q --filter "publish=9080") 2>$null
        } else {
            Write-Error "Cannot proceed with port 9080 in use"
            exit 1
        }
    }
}

Write-Success "Ports are available"

# Create environment file for Windows
Write-Info "Creating Windows environment file..."
$envContent = @"
NODE_ENV=production
NEXT_PUBLIC_ERP_ENV=$Environment

# Update these with your machine IP if needed
NEXT_PUBLIC_API_URL=http://localhost:9080/api
NEXT_PUBLIC_APP_URL=http://localhost:9080

# ERP URLs
ERP_BASE_URL=https://sinergia.digitalasiasolusindo.com
ERP_DEV_BASE_URL=https://sinergiadev.digitalasiasolusindo.com

# Session config
SESSION_TIMEOUT_MINUTES=60
AUTH_CHECK_INTERVAL_MINUTES=5
COOKIE_MAX_AGE_MINUTES=120

# Redis
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

# Database Configuration (localhost because SSH tunnel maps to local ports)
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
"@

$envContent | Out-File -FilePath ".env.windows" -Encoding UTF8
Write-Success "Environment file created: .env.windows"

# Copy environment to .env.local
Copy-Item ".env.windows" ".env.local"
Write-Success "Environment copied to .env.local"

# Check SSH key
Write-Info "Checking SSH private key..."
if (-not (Test-Path "secrets\ssh_private_key")) {
    Write-Warning "SSH private key 'secrets\ssh_private_key' not found!"
    Write-Warning "Run the SSH key setup first: .\setup-ssh-keys.ps1"
    Write-Warning "Or manually copy your key to: secrets\ssh_private_key"
    
    if (-not $Force) {
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            exit 1
        }
    }
} else {
    Write-Success "SSH private key found"
}

# Stop existing containers
Write-Info "Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down 2>$null

# Build and start
Write-Info "Building and starting containers..."
docker-compose -f docker-compose.simple.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start containers"
    Write-Info "Checking logs..."
    docker-compose -f docker-compose.simple.yml logs
    exit 1
}

# Wait for startup
Write-Info "Waiting for services to start..."
Start-Sleep -Seconds 20

# Health check
Write-Info "Performing health check..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9080/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Success "🎉 Deployment successful!"
        Write-Host ""
        Write-Success "📱 Application URLs:"
        Write-Host "   Local: http://localhost:9080"
        Write-Host "   Health: http://localhost:9080/api/health"
        Write-Host ""
        Write-Info "🔧 For external access:"
        Write-Host "   1. Get your IP: ipconfig"
        Write-Host "   2. Update NEXT_PUBLIC_API_URL in .env.windows"
        Write-Host "   3. Restart: docker-compose -f docker-compose.simple.yml restart"
        Write-Host ""
        Write-Success "✅ Ready for testing!"
    } else {
        throw "Health check returned status $($response.StatusCode)"
    }
} catch {
    Write-Warning "Health check failed: $($_.Exception.Message)"
    Write-Info "Checking logs..."
    docker-compose -f docker-compose.simple.yml logs
}

Write-Host ""
Write-Info "🛠️  Management Commands:"
Write-Host "   Stop:    docker-compose -f docker-compose.simple.yml down"
Write-Host "   Restart: docker-compose -f docker-compose.simple.yml restart"
Write-Host "   Logs:    docker-compose -f docker-compose.simple.yml logs -f"
Write-Host "   Status:  docker-compose -f docker-compose.simple.yml ps"