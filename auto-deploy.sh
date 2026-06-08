#!/bin/bash

# Auto-deployment script triggered by GitHub webhook
# This script pulls latest code, builds, and reloads PM2

set -Eeuo pipefail

APP_NAME="lost-and-found"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
LOCK_FILE="$PROJECT_DIR/.deploy.lock"

mkdir -p "$LOG_DIR"

install_dependencies() {
	echo "📦 Installing dependencies..." | tee -a "$LOG_DIR/deploy.log"

	if [ -f package-lock.json ]; then
		echo "🔒 Trying npm ci for clean reproducible install..." | tee -a "$LOG_DIR/deploy.log"
		if npm ci --no-audit --no-fund 2>&1 | tee -a "$LOG_DIR/deploy.log"; then
			return 0
		fi

		echo "⚠️  npm ci failed (likely lockfile mismatch). Falling back to npm install..." | tee -a "$LOG_DIR/deploy.log"
	fi
	npm install --no-audit --no-fund 2>&1 | tee -a "$LOG_DIR/deploy.log"
}

# Prevent overlapping deploy runs if multiple webhooks arrive together.
exec 200>"$LOCK_FILE"
flock -n 200 || {
	echo "⚠️  Deployment already in progress, skipping duplicate trigger - $(date)" | tee -a "$LOG_DIR/deploy.log"
	exit 0
}

echo "🔄 Auto-Deploy Triggered - $(date)" | tee -a "$LOG_DIR/deploy.log"

mkdir -p logs

# Navigate to project directory
cd "$PROJECT_DIR"

# Pull latest changes
echo "⬇️  Pulling latest changes from main..." | tee -a "$LOG_DIR/deploy.log"
git pull origin main 2>&1 | tee -a "$LOG_DIR/deploy.log"

# Install dependencies (in case package.json changed)
install_dependencies

# Build the application
echo "🔨 Building application..." | tee -a "$LOG_DIR/deploy.log"
npm run build 2>&1 | tee -a "$LOG_DIR/deploy.log"

# Reload PM2 with zero downtime, or start fresh if process is missing.
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
	echo "🔄 Reloading PM2 (zero downtime)..." | tee -a "$LOG_DIR/deploy.log"
	pm2 reload "$APP_NAME" 2>&1 | tee -a "$LOG_DIR/deploy.log"
else
	echo "🚀 PM2 app not found, starting from ecosystem config..." | tee -a "$LOG_DIR/deploy.log"
	pm2 start ecosystem.config.js 2>&1 | tee -a "$LOG_DIR/deploy.log"
fi

echo "💾 Saving PM2 process list..." | tee -a "$LOG_DIR/deploy.log"
pm2 save 2>&1 | tee -a "$LOG_DIR/deploy.log"

echo "✅ Auto-deploy completed successfully - $(date)" | tee -a "$LOG_DIR/deploy.log"
echo "----------------------------------------" | tee -a "$LOG_DIR/deploy.log"
