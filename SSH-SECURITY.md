# 🔐 Secure SSH Key Management

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER commit SSH private keys to Git repositories!** 

The `andrew.unknown` file contains sensitive SSH private key data that can provide server access. This repository uses a secure approach to handle SSH keys.

## 🛡️ Secure Setup Methods

### Method 1: Using Setup Scripts (Recommended)

#### Linux/Mac:
```bash
# Run the secure setup script
./setup-ssh-keys.sh

# Choose option 1 to copy existing key securely
# This will copy your key to secrets/ssh_private_key (git ignored)
```

#### Windows:
```powershell
# Run the secure setup script
.\setup-ssh-keys.ps1

# Or directly copy your key:
.\setup-ssh-keys.ps1 -CopyFrom "C:\path\to\your\ssh\key"
```

### Method 2: Manual Setup

1. **Create secrets directory:**
   ```bash
   mkdir -p secrets
   ```

2. **Copy your SSH private key:**
   ```bash
   # Linux/Mac
   cp /path/to/your/ssh/private/key secrets/ssh_private_key
   chmod 600 secrets/ssh_private_key
   
   # Windows
   copy "C:\path\to\your\ssh\key" "secrets\ssh_private_key"
   ```

3. **Verify the key works:**
   ```bash
   # Linux/Mac
   ./test-ssh-tunnel.sh
   
   # Windows
   .\test-ssh-tunnel.ps1
   ```

### Method 3: Environment Variable (Advanced)

For CI/CD or cloud deployments, you can use base64 encoded environment variables:

```bash
# Encode your SSH key
export SSH_PRIVATE_KEY_BASE64=$(base64 -w 0 your_private_key_file)

# Or on Windows PowerShell:
$env:SSH_PRIVATE_KEY_BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('your_private_key_file'))
```

## 📁 Directory Structure

```
project/
├── secrets/                    # Git ignored directory
│   ├── ssh_private_key        # Your SSH private key (secure)
│   └── ssh_private_key.pub    # Public key (if generated)
├── setup-ssh-keys.sh         # Linux/Mac setup script
├── setup-ssh-keys.ps1        # Windows setup script
├── test-ssh-tunnel.sh        # Linux/Mac test script
└── test-ssh-tunnel.ps1       # Windows test script
```

## 🔒 Security Features

1. **Git Ignored**: All sensitive files are in `.gitignore`
2. **Proper Permissions**: Scripts set correct file permissions (600)
3. **Secure Mounting**: Docker mounts keys as read-only
4. **Environment Support**: Alternative env var method for cloud
5. **Test Scripts**: Verify connectivity before deployment

## 🚀 Deployment Process

1. **Setup SSH keys securely:**
   ```bash
   ./setup-ssh-keys.sh
   ```

2. **Test connectivity:**
   ```bash
   ./test-ssh-tunnel.sh
   ```

3. **Deploy application:**
   ```bash
   # Linux/Mac
   ./deploy-ubuntu-simple.sh
   
   # Windows
   .\deploy-windows-docker.ps1
   ```

## 🐛 Troubleshooting

### SSH Key Not Found
```
❌ SSH private key 'secrets/ssh_private_key' not found!
```
**Solution:** Run `./setup-ssh-keys.sh` or manually copy your key to `secrets/ssh_private_key`

### Permission Denied
```
❌ Permission denied (publickey)
```
**Solutions:**
1. Check key permissions: `chmod 600 secrets/ssh_private_key`
2. Verify key is correct for the target server
3. Ensure public key is added to server's authorized_keys

### Connection Timeout
```
❌ SSH connection failed
```
**Solutions:**
1. Check server is accessible: `ping SERVER_IP`
2. Verify SSH port (usually 22) is open
3. Check firewall settings

## 📚 Best Practices

1. **Use different keys** for different environments (dev/prod)
2. **Rotate keys regularly** (every 6-12 months)
3. **Use strong passphrases** when generating keys
4. **Backup keys securely** (encrypted storage)
5. **Monitor key usage** in server logs
6. **Remove unused keys** from servers

## 🔄 Key Rotation

When rotating SSH keys:

1. **Generate new key pair:**
   ```bash
   ./setup-ssh-keys.sh
   # Choose option 2 to generate new key
   ```

2. **Add new public key to servers:**
   ```bash
   ssh-copy-id -i secrets/ssh_private_key.pub root@SERVER_IP
   ```

3. **Test new key:**
   ```bash
   ./test-ssh-tunnel.sh
   ```

4. **Remove old key from servers:**
   ```bash
   # Edit ~/.ssh/authorized_keys on each server
   # Remove the old public key line
   ```

## 📞 Support

If you encounter issues:

1. **Check scripts output** for specific error messages
2. **Verify network connectivity** to target servers
3. **Test SSH manually** before using Docker
4. **Check server logs** for authentication failures

---

**Remember**: SSH private keys are like passwords - keep them secure and never share them publicly!