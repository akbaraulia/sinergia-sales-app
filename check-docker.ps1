# Simple Docker Test Script
Write-Host "Checking Docker setup..." -ForegroundColor Green

# Check Docker
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "Docker not found or not running" -ForegroundColor Red
    exit 1
}

# Check Docker Compose
$composeVersion = docker-compose --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker Compose installed: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "Docker Compose not found" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
$dockerInfo = docker info 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker is running" -ForegroundColor Green
} else {
    Write-Host "Docker is not running - Start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "All Docker checks passed!" -ForegroundColor Green
