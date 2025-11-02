#!/bin/bash

# Lost & Found Portal - Deployment Script
# This script helps you deploy the application quickly

set -e

echo "🚀 Lost & Found Portal - Docker Deployment"
echo "==========================================="
echo ""

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

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your Supabase credentials."
        echo "   Run: nano .env"
        exit 0
    else
        echo "❌ .env.example not found. Please create a .env file manually."
        exit 1
    fi
fi

echo "📋 Checking environment variables..."
source .env

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required environment variables in .env file"
    echo "   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Menu
echo "Select deployment action:"
echo "1) Build and start (first time deployment)"
echo "2) Start existing container"
echo "3) Stop container"
echo "4) Rebuild and restart (after code changes)"
echo "5) View logs"
echo "6) Remove all containers and images"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🔨 Building Docker image..."
        docker-compose build
        echo "🚀 Starting container..."
        docker-compose up -d
        echo "✅ Application deployed successfully!"
        echo "🌐 Access it at: http://localhost:3000"
        echo "📊 View logs: docker-compose logs -f app"
        ;;
    2)
        echo "🚀 Starting container..."
        docker-compose up -d
        echo "✅ Application started!"
        echo "🌐 Access it at: http://localhost:3000"
        ;;
    3)
        echo "🛑 Stopping container..."
        docker-compose down
        echo "✅ Application stopped!"
        ;;
    4)
        echo "🔨 Rebuilding Docker image..."
        docker-compose build --no-cache
        echo "🔄 Restarting container..."
        docker-compose up -d
        echo "✅ Application rebuilt and restarted!"
        echo "🌐 Access it at: http://localhost:3000"
        ;;
    5)
        echo "📊 Viewing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f app
        ;;
    6)
        echo "⚠️  This will remove all containers, images, and volumes!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "🗑️  Removing containers and images..."
            docker-compose down --rmi all --volumes
            echo "✅ Cleanup completed!"
        else
            echo "❌ Cancelled"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
