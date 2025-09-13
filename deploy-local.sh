#!/bin/bash

echo "🚀 Starting Bon Voyage Local Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "📋 Checking service status..."
docker-compose -f docker-compose.dev.yml ps

# Test API health
echo "🏥 Testing API health..."
sleep 5
curl -f http://localhost:3000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API is healthy!"
else
    echo "⚠️  API health check failed, but services might still be starting..."
fi

echo ""
echo "🎉 Local deployment completed!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend & Backend: http://localhost:3001"
echo "   Police Dashboard: http://localhost:3001/police-dashboard.html"
echo "   API Health: http://localhost:3001/api/health"
echo "   Database Admin: http://localhost:3001/db-admin.html"
echo ""
echo "📊 Database Ports:"
echo "   PostgreSQL: localhost:5433"
echo "   MongoDB: localhost:27018"
echo "   Redis: localhost:6380"
echo ""
echo "🧪 Test Login Credentials:"
echo "   Email: sandra@email.com"
echo "   Password: demo123"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   Restart: docker-compose -f docker-compose.dev.yml restart"