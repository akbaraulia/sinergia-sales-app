#!/bin/bash

# Docker deployment script for Sinergia Sales Web

set -e

echo "🚀 Starting Docker deployment for Sinergia Sales Web..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Generate SSL certificate if not exists
if [ ! -f "nginx/ssl/cert.pem" ]; then
    print_status "SSL certificate not found. Generating self-signed certificate..."
    if command -v openssl &> /dev/null; then
        ./generate-ssl.sh
    else
        print_warning "OpenSSL not found. Please install OpenSSL or generate SSL certificate manually."
        print_warning "Creating dummy SSL files for now..."
        mkdir -p nginx/ssl
        touch nginx/ssl/cert.pem
        touch nginx/ssl/key.pem
    fi
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p data

# Build and start containers
print_status "Building and starting Docker containers..."

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Build new images
print_status "Building new images..."
docker-compose build --no-cache

# Start containers
print_status "Starting containers..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Health check
print_status "Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Health check passed!"
else
    print_warning "Health check failed. Checking container logs..."
    docker-compose logs sinergia-web
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

print_success "Deployment completed!"
print_status "Application is available at:"
echo "  🌐 HTTP:  http://localhost"
echo "  🔒 HTTPS: https://localhost"
echo "  📊 Direct: http://localhost:3000"

print_status "To view logs, run:"
echo "  docker-compose logs -f sinergia-web"

print_status "To stop the application, run:"
echo "  docker-compose down"
