# PowerShell deployment script for Windows

param(
    [string]$Environment = "development",
    [switch]$Build = $false,
    [switch]$Stop = $false,
    [switch]$Logs = $false
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Status($Message) {
    Write-ColorOutput Blue "[INFO] $Message"
}

function Write-Success($Message) {
    Write-ColorOutput Green "[SUCCESS] $Message"
}

function Write-Warning($Message) {
    Write-ColorOutput Yellow "[WARNING] $Message"
}

function Write-Error($Message) {
    Write-ColorOutput Red "[ERROR] $Message"
}

Write-Status "🚀 Starting Docker deployment for Sinergia Sales Web..."

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Status "Docker is running."
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    Write-Status "You can start Docker Desktop from:"
    Write-Status "  - Start Menu > Docker Desktop"
    Write-Status "  - Or run: 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
    exit 1
}

# Check if Docker Compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error "Docker Compose is not available. Please ensure Docker Desktop is running."
    exit 1
}

# Handle different commands
if ($Stop) {
    Write-Status "Stopping containers..."
    docker-compose down --remove-orphans
    Write-Success "Containers stopped!"
    exit 0
}

if ($Logs) {
    Write-Status "Showing container logs..."
    docker-compose logs -f sinergia-web
    exit 0
}

# Generate SSL certificate if not exists
if (!(Test-Path "nginx\ssl\cert.pem")) {
    Write-Status "SSL certificate not found. Generating self-signed certificate..."
    
    # Check if OpenSSL is available
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        Write-Status "Using OpenSSL to generate certificate..."
        & .\generate-ssl.sh
    } else {
        Write-Status "Using PowerShell to generate certificate..."
        & .\generate-ssl.ps1
    }
}

# Create necessary directories
Write-Status "Creating necessary directories..."
New-Item -ItemType Directory -Path "logs" -Force | Out-Null
New-Item -ItemType Directory -Path "data" -Force | Out-Null

# Stop existing containers
Write-Status "Stopping existing containers..."
docker-compose down --remove-orphans

if ($Build) {
    # Build new images
    Write-Status "Building new images..."
    docker-compose build --no-cache
}

# Start containers
Write-Status "Starting containers..."
if ($Environment -eq "production") {
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
} else {
    docker-compose up -d
}

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Health check
Write-Status "Performing health check..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Success "Health check passed!"
    } else {
        Write-Warning "Health check returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Health check failed. Checking container logs..."
    docker-compose logs sinergia-web
}

# Show running containers
Write-Status "Running containers:"
docker-compose ps

Write-Success "Deployment completed!"
Write-Status "Application is available at:"
Write-Host "  🌐 HTTP:  http://localhost" -ForegroundColor Cyan
Write-Host "  🔒 HTTPS: https://localhost" -ForegroundColor Cyan
Write-Host "  📊 Direct: http://localhost:3000" -ForegroundColor Cyan

Write-Status "To view logs, run:"
Write-Host "  .\deploy.ps1 -Logs" -ForegroundColor Yellow

Write-Status "To stop the application, run:"
Write-Host "  .\deploy.ps1 -Stop" -ForegroundColor Yellow

Write-Status "To rebuild and deploy, run:"
Write-Host "  .\deploy.ps1 -Build" -ForegroundColor Yellow
