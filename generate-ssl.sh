#!/bin/bash

# Self-signed SSL certificate generator for development
# Untuk production, gunakan Let's Encrypt atau SSL certificate dari provider

echo "🔐 Generating self-signed SSL certificate for development..."

# Generate private key
openssl genrsa -out nginx/ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key nginx/ssl/key.pem -out nginx/ssl/cert.csr -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Sinergia/OU=IT/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in nginx/ssl/cert.csr -signkey nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Clean up CSR file
rm nginx/ssl/cert.csr

echo "✅ SSL certificate generated successfully!"
echo "📁 Files created:"
echo "   - nginx/ssl/key.pem (Private Key)"
echo "   - nginx/ssl/cert.pem (Certificate)"
echo ""
echo "⚠️  WARNING: This is a self-signed certificate for development only!"
echo "   For production, use a valid SSL certificate from a trusted CA."
