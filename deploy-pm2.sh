#!/bin/bash

# Lost & Found Portal - PM2 Deployment Script
# Quick deployment script for school server

set -Eeuo pipefail

APP_NAME="lost-and-found"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

install_dependencies() {
    echo "📦 Installing dependencies..."

    if [ -f package-lock.json ]; then
        echo "🔒 Trying npm ci for clean reproducible install..."
        if npm ci --no-audit --no-fund; then
            return 0
        fi

        echo "⚠️  npm ci failed (likely lockfile mismatch). Falling back to npm install..."
    fi

    npm install --no-audit --no-fund
}

ensure_pm2_startup() {
    mkdir -p "$LOG_DIR"

    echo ""
    echo "⚙️  Ensuring app auto-starts after server reboot..."

    # Save current process list first so PM2 can resurrect the app.
    pm2 save

    local service_name="pm2-$USER"
    local startup_configured="false"

    if command -v systemctl &> /dev/null; then
        if systemctl list-unit-files | grep -q "^${service_name}\\.service"; then
            startup_configured="true"
            echo "✅ PM2 startup service already configured: ${service_name}.service"
        fi
    fi

    if [ "$startup_configured" = "false" ]; then
        echo "🔧 Configuring PM2 system startup..."
        local startup_output
        startup_output="$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1 || true)"
        echo "$startup_output"

        local startup_cmd
        startup_cmd="$(echo "$startup_output" | grep -E '^sudo ' | tail -n 1 || true)"

        if [ -n "$startup_cmd" ]; then
            if command -v sudo &> /dev/null; then
                echo "🔐 Running startup command with sudo..."
                sudo bash -lc "$startup_cmd" || true
            else
                echo "⚠️  sudo is unavailable. Run this manually once:"
                echo "   $startup_cmd"
            fi
        fi
    fi

    # Fallback: ensure PM2 resurrect runs at reboot even if systemd service fails.
    local resurrect_line="@reboot cd $PROJECT_DIR && pm2 resurrect >> $LOG_DIR/pm2-resurrect.log 2>&1"
    local existing_cron
    existing_cron="$(crontab -l 2>/dev/null || true)"

    if ! echo "$existing_cron" | grep -Fq "$resurrect_line"; then
        echo "🛟 Adding @reboot fallback via crontab (pm2 resurrect)..."
        {
            echo "$existing_cron"
            echo "$resurrect_line"
        } | awk 'NF' | crontab -
        echo "✅ Added crontab reboot fallback"
    else
        echo "✅ Crontab reboot fallback already exists"
    fi

    pm2 save
    echo "✅ Auto-start configuration complete"
}

ensure_process_running() {
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        echo "🔄 Reloading $APP_NAME with PM2 (zero downtime)..."
        pm2 reload "$APP_NAME"
    else
        echo "🚀 $APP_NAME is not running. Starting it now..."
        pm2 start ecosystem.config.js
    fi

    pm2 save
}

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
    echo "  DATABASE_URL=mysql://user:pass@localhost:3306/db_name"
    echo "  JWT_SECRET=your-secure-jwt-secret"
    echo "  SITE_URL=https://your-subdomain.school.edu"
    echo "  NODE_ENV=production"
    echo "  PORT=20089"
    exit 1
fi

# Create logs directory
mkdir -p "$LOG_DIR"

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
echo "9) Repair auto-start after reboot"
echo ""
read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        install_dependencies
        
        echo "🔧 Generating Prisma Client..."
        npx prisma generate

        echo "🗄️ Pushing database schema to MariaDB..."
        npx prisma db push

        echo "🔨 Building application..."
        npm run build

        echo "📂 Copying static assets for standalone server..."
        mkdir -p .next/standalone/.next/static
        cp -r .next/static/. .next/standalone/.next/static/
        if [ -d public ]; then
            mkdir -p .next/standalone/public
            cp -r public/. .next/standalone/public/
        fi
        
        echo "🚀 Starting with PM2..."
        pm2 start ecosystem.config.js

        ensure_pm2_startup
        
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
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        echo "⬇️  Pulling latest changes from $CURRENT_BRANCH..."
        git pull origin "$CURRENT_BRANCH"

        install_dependencies
        
        echo "🔧 Generating Prisma Client..."
        npx prisma generate

        echo "🗄️ Pushing database schema to MariaDB..."
        npx prisma db push

        echo "🔨 Building application..."
        npm run build

        echo "📂 Copying static assets for standalone server..."
        mkdir -p .next/standalone/.next/static
        cp -r .next/static/. .next/standalone/.next/static/
        if [ -d public ]; then
            mkdir -p .next/standalone/public
            cp -r public/. .next/standalone/public/
        fi
        
        ensure_process_running
        ensure_pm2_startup
        
        echo "✅ Update complete!"
        ;;
    3)
        echo "🚀 Starting application..."
        pm2 start ecosystem.config.js
        ensure_pm2_startup
        echo "✅ Application started!"
        ;;
    4)
        echo "🛑 Stopping application..."
        pm2 stop lost-and-found
        echo "✅ Application stopped!"
        ;;
    5)
        echo "🔄 Restarting application..."
        pm2 restart "$APP_NAME"
        pm2 save
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
            pm2 delete "$APP_NAME"
            echo "✅ Application removed!"
        else
            echo "❌ Cancelled"
        fi
        ;;
    9)
        ensure_pm2_startup
        echo "✅ Auto-start repair complete!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
