# Simple Docker Test Script
Write-Host "=== Docker Setup Test ===" -ForegroundColor Cyan

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Blue
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    Write-Host "✓ Docker found" -ForegroundColor Green
    
    # Check if running
    $dockerTest = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green
        $dockerOk = $true
    } else {
        Write-Host "✗ Docker not running - Start Docker Desktop" -ForegroundColor Red
        $dockerOk = $false
    }
} else {
    Write-Host "✗ Docker not found" -ForegroundColor Red
    $dockerOk = $false
}

# Check Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Blue
$compose = Get-Command docker-compose -ErrorAction SilentlyContinue
if ($compose) {
    Write-Host "✓ Docker Compose found" -ForegroundColor Green
    $composeOk = $true
} else {
    Write-Host "✗ Docker Compose not found" -ForegroundColor Red
    $composeOk = $false
}

# Check files
Write-Host "Checking files..." -ForegroundColor Blue
$filesOk = $true
$files = @("Dockerfile", "docker-compose.yml", ".dockerignore")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
        $filesOk = $false
    }
}

# Summary
Write-Host ""
if ($dockerOk -and $composeOk -and $filesOk) {
    Write-Host "✅ Ready for Docker!" -ForegroundColor Green
    Write-Host "Run: npm run docker:dev" -ForegroundColor Yellow
} else {
    Write-Host "❌ Please fix issues above" -ForegroundColor Red
}
