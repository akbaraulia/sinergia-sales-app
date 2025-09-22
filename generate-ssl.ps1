# PowerShell script untuk generate SSL certificate di Windows

Write-Host "Generating self-signed SSL certificate for development..." -ForegroundColor Green

# Pastikan directory ssl ada
if (!(Test-Path "nginx\ssl")) {
    New-Item -ItemType Directory -Path "nginx\ssl" -Force
}

# Generate self-signed certificate menggunakan PowerShell
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost", "127.0.0.1" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddDays(365) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Sinergia Development Certificate" `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Export certificate to PEM format
$certPath = "nginx\ssl\cert.pem"
$keyPath = "nginx\ssl\key.pem"

# Export certificate
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n" + [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath $certPath -Encoding ASCII

# Export private key (ini agak tricky di PowerShell, alternative method)
Write-Host "Note: Private key export requires manual step or OpenSSL" -ForegroundColor Yellow
Write-Host "   For development, you can use the certificate from Windows Certificate Store" -ForegroundColor Yellow
Write-Host "   Or install OpenSSL and run: openssl pkcs12 -in cert.p12 -out key.pem -nodes" -ForegroundColor Yellow

Write-Host "SSL certificate generated successfully!" -ForegroundColor Green
Write-Host "Certificate location: $certPath" -ForegroundColor Cyan
Write-Host "Certificate thumbprint: $($cert.Thumbprint)" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This is a self-signed certificate for development only!" -ForegroundColor Red
Write-Host "   For production, use a valid SSL certificate from a trusted CA." -ForegroundColor Red
