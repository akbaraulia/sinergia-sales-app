# Simple Docker Test Script

Write-Host "=== Docker Setup Test ===" -ForegroundColor Cyan

# Test Docker
Write-Host "Checking Docker..." -ForegroundColor Blue
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "✓ Docker found" -ForegroundColor Green
    
    # Test if running
    try {
        docker ps 2>$null | Out-Null
        Write-Host "✓ Docker is running" -ForegroundColor Green
        $dockerRunning = $true
    } catch {
        Write-Host "✗ Docker not running - Please start Docker Desktop" -ForegroundColor Red
        $dockerRunning = $false
    }
} else {
    Write-Host "✗ Docker not installed" -ForegroundColor Red
    $dockerRunning = $false
}

# Test Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Blue
$composeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if ($composeInstalled) {
    Write-Host "✓ Docker Compose found" -ForegroundColor Green
} else {
    Write-Host "✗ Docker Compose not found" -ForegroundColor Red
}

# Test Files
Write-Host "Checking files..." -ForegroundColor Blue
$requiredFiles = @("Dockerfile", "docker-compose.yml", ".dockerignore")
$filesOk = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
        $filesOk = $false
    }
}

# Summary
Write-Host ""
if ($dockerRunning -and $composeInstalled -and $filesOk) {
    Write-Host "✅ Ready for Docker deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next commands:" -ForegroundColor Yellow
    Write-Host "  npm run docker:dev    # Development with hot reload"
    Write-Host "  npm run docker:prod   # Production build"
    Write-Host "  .\deploy.ps1          # Full deployment script"
} else {
    Write-Host "❌ Setup incomplete" -ForegroundColor Red
    if (!$dockerRunning) {
        Write-Host "→ Start Docker Desktop first" -ForegroundColor Yellow
    }
}
