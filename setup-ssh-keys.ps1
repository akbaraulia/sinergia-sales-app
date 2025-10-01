# Secure SSH Key Setup for Docker Deployment (Windows)
# This script helps setup SSH keys securely without committing them to Git

param(
    [switch]$GenerateNew,
    [string]$CopyFrom,
    [switch]$UseEnvVar
)

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Info "🔐 Setting up SSH keys securely for Docker deployment..."

# Create secrets directory if it doesn't exist
if (-not (Test-Path "secrets")) {
    New-Item -ItemType Directory -Path "secrets" | Out-Null
}

if ($CopyFrom) {
    Write-Info "Option 1: Copy existing SSH key"
    if (Test-Path $CopyFrom) {
        Copy-Item $CopyFrom "secrets\ssh_private_key"
        Write-Success "SSH key copied to secrets\ssh_private_key"
    } else {
        Write-Error "SSH key not found at: $CopyFrom"
        exit 1
    }
} elseif ($GenerateNew) {
    Write-Info "Option 2: Generate new SSH key pair"
    Write-Warning "This will generate a new key pair. You'll need to add the public key to your servers."
    $confirm = Read-Host "Continue? (y/N)"
    
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        ssh-keygen -t rsa -b 4096 -f "secrets/ssh_private_key" -N '""' -C "docker-deployment"
        Write-Success "New SSH key pair generated"
        Write-Warning "📋 Add this public key to your servers:"
        Get-Content "secrets\ssh_private_key.pub"
        Write-Host ""
        Write-Warning "💡 Command to add to server: ssh-copy-id -i secrets/ssh_private_key.pub root@SERVER_IP"
    } else {
        Write-Host "Cancelled."
        exit 1
    }
} elseif ($UseEnvVar) {
    Write-Info "Option 3: Use environment variable"
    Write-Warning "💡 You can set SSH_PRIVATE_KEY_BASE64 environment variable"
    Write-Warning "   Example: `$env:SSH_PRIVATE_KEY_BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('your_key_file'))"
    Write-Host ""
    Write-Info "Creating .env.ssh file for environment setup..."
    
    $envContent = @"
# SSH Private Key (base64 encoded)
# To encode your key on Windows: [Convert]::ToBase64String([IO.File]::ReadAllBytes('your_private_key_file'))
# SSH_PRIVATE_KEY_BASE64=your_base64_encoded_private_key_here

# Alternative: Use Docker secrets mounting
# Place your SSH private key in: secrets/ssh_private_key
"@
    
    $envContent | Out-File -FilePath ".env.ssh" -Encoding UTF8
    Write-Success "Created .env.ssh template"
    Write-Warning "📝 Edit .env.ssh and add your base64 encoded SSH key"
} else {
    Write-Info "SSH Key Setup Options:"
    Write-Host "Usage:"
    Write-Host "  .\setup-ssh-keys.ps1 -CopyFrom 'C:\path\to\your\ssh\key'"
    Write-Host "  .\setup-ssh-keys.ps1 -GenerateNew"
    Write-Host "  .\setup-ssh-keys.ps1 -UseEnvVar"
    Write-Host ""
    
    $choice = Read-Host "Choose: [1] Copy existing, [2] Generate new, [3] Use env var (1-3)"
    
    switch ($choice) {
        "1" {
            $keyPath = Read-Host "SSH key path"
            if (Test-Path $keyPath) {
                Copy-Item $keyPath "secrets\ssh_private_key"
                Write-Success "SSH key copied to secrets\ssh_private_key"
            } else {
                Write-Error "SSH key not found at: $keyPath"
                exit 1
            }
        }
        "2" {
            Write-Warning "This will generate a new key pair. You'll need to add the public key to your servers."
            $confirm = Read-Host "Continue? (y/N)"
            
            if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                ssh-keygen -t rsa -b 4096 -f "secrets/ssh_private_key" -N '""' -C "docker-deployment"
                Write-Success "New SSH key pair generated"
                Write-Warning "📋 Add this public key to your servers:"
                Get-Content "secrets\ssh_private_key.pub"
                Write-Host ""
                Write-Warning "💡 Command to add to server: ssh-copy-id -i secrets/ssh_private_key.pub root@SERVER_IP"
            } else {
                Write-Host "Cancelled."
                exit 1
            }
        }
        "3" {
            Write-Info "Creating .env.ssh file for environment setup..."
            
            $envContent = @"
# SSH Private Key (base64 encoded)
# To encode your key on Windows: [Convert]::ToBase64String([IO.File]::ReadAllBytes('your_private_key_file'))
# SSH_PRIVATE_KEY_BASE64=your_base64_encoded_private_key_here

# Alternative: Use Docker secrets mounting
# Place your SSH private key in: secrets/ssh_private_key
"@
            
            $envContent | Out-File -FilePath ".env.ssh" -Encoding UTF8
            Write-Success "Created .env.ssh template"
            Write-Warning "📝 Edit .env.ssh and add your base64 encoded SSH key"
        }
        default {
            Write-Error "Invalid option"
            exit 1
        }
    }
}

# Update .gitignore to make sure secrets are not committed
Write-Info "Updating .gitignore to protect secrets..."
$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
if (-not ($gitignoreContent -contains "secrets/")) {
    Add-Content -Path ".gitignore" -Value "`n# Secrets directory`nsecrets/"
}

Write-Success "✅ SSH key setup completed securely!"
Write-Host ""
Write-Warning "🔒 Security Notes:"
Write-Host "   - SSH keys are stored in secrets/ directory (git ignored)"
Write-Host "   - Never commit SSH private keys to Git"
Write-Host "   - Use different keys for different environments if possible"
Write-Host "   - Regularly rotate your SSH keys"
Write-Host ""
Write-Info "ℹ️  Next steps:"
Write-Host "   1. Run deployment script: .\deploy-windows-docker.ps1"
Write-Host "   2. Or use Docker directly: docker-compose -f docker-compose.simple.yml up -d --build"