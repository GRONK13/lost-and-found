# Lost & Found Portal - Deployment Script (PowerShell)
# This script helps you deploy the application quickly on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Lost & Found Portal - Docker Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✅ .env file created. Please edit it with your Supabase credentials." -ForegroundColor Green
        Write-Host "   Run: notepad .env" -ForegroundColor White
        exit 0
    } else {
        Write-Host "❌ .env.example not found. Please create a .env file manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Checking environment variables..." -ForegroundColor White

# Read .env file
$envVars = Get-Content .env | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" -or $_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" }

if ($envVars.Count -lt 2) {
    Write-Host "❌ Missing required environment variables in .env file" -ForegroundColor Red
    Write-Host "   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "Select deployment action:" -ForegroundColor Cyan
Write-Host "1) Build and start (first time deployment)"
Write-Host "2) Start existing container"
Write-Host "3) Stop container"
Write-Host "4) Rebuild and restart (after code changes)"
Write-Host "5) View logs"
Write-Host "6) Remove all containers and images"
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
        docker-compose build
        Write-Host "🚀 Starting container..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "✅ Application deployed successfully!" -ForegroundColor Green
        Write-Host "🌐 Access it at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📊 View logs: docker-compose logs -f app" -ForegroundColor White
    }
    "2" {
        Write-Host "🚀 Starting container..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "✅ Application started!" -ForegroundColor Green
        Write-Host "🌐 Access it at: http://localhost:3000" -ForegroundColor Cyan
    }
    "3" {
        Write-Host "🛑 Stopping container..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ Application stopped!" -ForegroundColor Green
    }
    "4" {
        Write-Host "🔨 Rebuilding Docker image..." -ForegroundColor Yellow
        docker-compose build --no-cache
        Write-Host "🔄 Restarting container..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "✅ Application rebuilt and restarted!" -ForegroundColor Green
        Write-Host "🌐 Access it at: http://localhost:3000" -ForegroundColor Cyan
    }
    "5" {
        Write-Host "📊 Viewing logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker-compose logs -f app
    }
    "6" {
        Write-Host "⚠️  This will remove all containers, images, and volumes!" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host "🗑️  Removing containers and images..." -ForegroundColor Yellow
            docker-compose down --rmi all --volumes
            Write-Host "✅ Cleanup completed!" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelled" -ForegroundColor Red
        }
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}
