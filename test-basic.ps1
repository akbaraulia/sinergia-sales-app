Write-Host "=== Docker Setup Test ===" -ForegroundColor Cyan

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Blue
docker --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker installed" -ForegroundColor Green
} else {
    Write-Host "✗ Docker not found" -ForegroundColor Red
}

# Check Docker running
Write-Host "Testing Docker daemon..." -ForegroundColor Blue
docker ps
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker is running" -ForegroundColor Green
    $dockerRunning = $true
} else {
    Write-Host "✗ Docker not running - Start Docker Desktop" -ForegroundColor Red
    $dockerRunning = $false
}

# Check files
Write-Host "Checking files..." -ForegroundColor Blue
if (Test-Path "Dockerfile") {
    Write-Host "✓ Dockerfile exists" -ForegroundColor Green
}
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ docker-compose.yml exists" -ForegroundColor Green
}
if (Test-Path ".dockerignore") {
    Write-Host "✓ .dockerignore exists" -ForegroundColor Green
}

Write-Host ""
if ($dockerRunning) {
    Write-Host "✅ Ready! Run: npm run docker:dev" -ForegroundColor Green
} else {
    Write-Host "❌ Start Docker Desktop first" -ForegroundColor Red
}
