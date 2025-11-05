#!/bin/bash

# Lost & Found Portal - PM2 Deployment Script
# Quick deployment script for school server

set -e

echo "🚀 Lost & Found Portal - PM2 Deployment"
echo "========================================"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed."
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Check if .env.production.local exists
if [ ! -f .env.production.local ]; then
    echo "⚠️  .env.production.local not found!"
    echo "📝 Please create .env.production.local with your configuration"
    echo ""
    echo "Required variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "  SITE_URL=https://your-subdomain.school.edu"
    echo "  NODE_ENV=production"
    echo "  PORT=20089"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Menu
echo "Select deployment action:"
echo "1) First time deployment (install, build, start)"
echo "2) Update and redeploy (pull, build, reload)"
echo "3) Start application"
echo "4) Stop application"
echo "5) Restart application"
echo "6) View logs"
echo "7) Monitor application"
echo "8) Remove application from PM2"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo "📦 Installing dependencies..."
        npm install
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting with PM2..."
        pm2 start ecosystem.config.js
        
        echo "💾 Saving PM2 process list..."
        pm2 save
        
        echo ""
        echo "⚙️  Configuring auto-startup on server boot..."
        pm2 startup | grep -E "^sudo" | bash || true
        pm2 save
        
        echo ""
        echo "✅ Deployment complete!"
        echo "📊 View status: pm2 status"
        echo "📋 View logs: pm2 logs lost-and-found"
        echo "🌐 Access your app at: http://localhost:20089"
        echo ""
        echo "✨ App will now automatically start when server boots!"
        echo ""
        echo "📝 Next: Set up GitHub auto-deploy webhook"
        echo "   1. Go to your GitHub repo → Settings → Webhooks"
        echo "   2. Add webhook URL: https://lost-n-found.dcism.org/api/deploy"
        echo "   3. Content type: application/json"
        echo "   4. Secret: (generate a random secret and add to .env.production.local)"
        echo "   5. Select: Just the push event"
        ;;
    2)
        echo "⬇️  Pulling latest changes..."
        git pull origin main
        
        echo "📦 Installing dependencies..."
        npm install
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🔄 Reloading with PM2 (zero downtime)..."
        pm2 reload lost-and-found
        
        echo "✅ Update complete!"
        ;;
    3)
        echo "🚀 Starting application..."
        pm2 start ecosystem.config.js
        echo "✅ Application started!"
        ;;
    4)
        echo "🛑 Stopping application..."
        pm2 stop lost-and-found
        echo "✅ Application stopped!"
        ;;
    5)
        echo "🔄 Restarting application..."
        pm2 restart lost-and-found
        echo "✅ Application restarted!"
        ;;
    6)
        echo "📊 Viewing logs (Press Ctrl+C to exit)..."
        pm2 logs lost-and-found
        ;;
    7)
        echo "📈 Monitoring application (Press Ctrl+C to exit)..."
        pm2 monit
        ;;
    8)
        echo "⚠️  This will remove the application from PM2!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "🗑️  Removing application..."
            pm2 delete lost-and-found
            echo "✅ Application removed!"
        else
            echo "❌ Cancelled"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
