#!/bin/bash

# Bon Voyage Deployment Script
echo "🚀 Starting Bon Voyage deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set environment
ENVIRONMENT=${1:-dev}

echo "📦 Deploying in $ENVIRONMENT mode..."

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🔧 Setting up production environment..."
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        echo "❌ .env.production file not found. Please create it with production values."
        exit 1
    fi
    
    # Copy production env file
    cp .env.production .env
    
    # Build and start production containers
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "✅ Production deployment completed!"
    echo "🌐 Application should be available at http://localhost"
    
else
    echo "🔧 Setting up development environment..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "⚠️  .env file not found. Using default values..."
    fi
    
    # Build and start development containers
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "✅ Development deployment completed!"
    echo "🌐 Application should be available at http://localhost:3000"
    echo "📊 Police Dashboard: http://localhost:3000/police-dashboard.html"
fi

# Show running containers
echo "📋 Running containers:"
docker-compose ps

# Show logs
echo "📝 Recent logs:"
docker-compose logs --tail=20

echo "🎉 Deployment completed successfully!"
echo ""
echo "📚 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Access database: docker-compose exec postgres psql -U postgres -d tourist_safety_db"
