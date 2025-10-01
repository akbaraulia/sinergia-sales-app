# Test SSH Tunnel Connection for Database Access on Windows

param(
    [switch]$SkipMySQL
)

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Info "🔍 Testing SSH Tunnel Connection for Database Access..."

# Check if SSH key exists
if (-not (Test-Path "secrets\ssh_private_key")) {
    Write-Error "SSH private key 'secrets\ssh_private_key' not found"
    Write-Warning "Run the SSH key setup first: .\setup-ssh-keys.ps1"
    Write-Warning "Or manually copy your SSH private key to: secrets\ssh_private_key"
    exit 1
}

Write-Success "SSH private key found"

# Test SSH connection to LIVE server
Write-Info "Testing SSH connection to LIVE server (192.168.10.129)..."
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes -i secrets/ssh_private_key root@192.168.10.129 "echo 'SSH connection successful'" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "LIVE SSH connection successful"
        $liveSSH = $true
    } else {
        throw "SSH connection failed"
    }
} catch {
    Write-Error "LIVE SSH connection failed"
    Write-Warning "Please check:"
    Write-Warning "- Server is accessible (ping 192.168.10.129)"
    Write-Warning "- SSH key is correct"
    Write-Warning "- Firewall allows SSH (port 22)"
    $liveSSH = $false
}

# Test SSH connection to DEV server
Write-Info "Testing SSH connection to DEV server (192.168.10.159)..."
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes -i secrets/ssh_private_key root@192.168.10.159 "echo 'SSH connection successful'" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "DEV SSH connection successful"
        $devSSH = $true
    } else {
        throw "SSH connection failed"
    }
} catch {
    Write-Error "DEV SSH connection failed"
    Write-Warning "Please check:"
    Write-Warning "- Server is accessible (ping 192.168.10.159)"
    Write-Warning "- SSH key is correct"
    Write-Warning "- Firewall allows SSH (port 22)"
    $devSSH = $false
}

# Test MySQL connectivity through SSH tunnel (LIVE) if SSH works
if ($liveSSH -and -not $SkipMySQL) {
    Write-Info "Testing MySQL connection through SSH tunnel (LIVE)..."
    
    # Start SSH tunnel in background
    $sshJob = Start-Job -ScriptBlock {
        ssh -i secrets/ssh_private_key -L 13306:127.0.0.1:3306 -N root@192.168.10.129
    }
    
    Start-Sleep -Seconds 3
    
    # Check if MySQL client is available
    $mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlPath) {
        try {
            $mysqlTest = mysql -h 127.0.0.1 -P 13306 -u readonly_user -p1a176bee987852f3e928 -e "SELECT 1;" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "MySQL connection through SSH tunnel successful"
            } else {
                Write-Error "MySQL connection through SSH tunnel failed"
                Write-Warning "Database may not be accessible or credentials incorrect"
            }
        } catch {
            Write-Error "MySQL connection test failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "MySQL client not installed, skipping database test"
        Write-Info "You can install MySQL client or use Docker to test database connectivity"
    }
    
    # Stop SSH tunnel
    Stop-Job $sshJob -Force
    Remove-Job $sshJob -Force
}

Write-Host ""
Write-Info "SSH Tunnel Configuration for Docker:"
Write-Warning "- SSH keys will be mounted to: /home/nextjs/.ssh/andrew.unknown"
Write-Warning "- Database host in container: 127.0.0.1 (localhost)"
Write-Warning "- SSH tunnel will be established automatically"
Write-Host ""

if ($liveSSH -or $devSSH) {
    Write-Success "✅ SSH tunnel test completed - Ready for Docker deployment"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "1. Run: .\deploy-windows-docker.ps1"
    Write-Host "2. Or: docker-compose -f docker-compose.simple.yml up -d --build"
} else {
    Write-Error "❌ SSH tunnel test failed - Please fix SSH connectivity first"
}