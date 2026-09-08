#!/bin/bash

# Auto-deployment script triggered by GitHub webhook
# This script pulls latest code, builds, and reloads PM2

set -Eeuo pipefail

# Ensure PM2, npm, and Node are in PATH even in background subshells
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.npm-global/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
if [ -f "$HOME/.bashrc" ]; then source "$HOME/.bashrc" 2>/dev/null || true; fi
if [ -f "$HOME/.profile" ]; then source "$HOME/.profile" 2>/dev/null || true; fi

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

# Pull latest changes from active branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
echo "⬇️  Pulling latest changes from $CURRENT_BRANCH..." | tee -a "$LOG_DIR/deploy.log"
git pull origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_DIR/deploy.log"

# Install dependencies (in case package.json changed)
install_dependencies

# Generate Prisma Client
echo "🔧 Generating Prisma Client..." | tee -a "$LOG_DIR/deploy.log"
npx --no-install prisma generate 2>&1 | tee -a "$LOG_DIR/deploy.log"

# Push database schema to MariaDB
echo "🗄️ Pushing database schema to MariaDB..." | tee -a "$LOG_DIR/deploy.log"
npx --no-install prisma db push 2>&1 | tee -a "$LOG_DIR/deploy.log"

# Build the application
echo "🔨 Building application..." | tee -a "$LOG_DIR/deploy.log"
npm run build 2>&1 | tee -a "$LOG_DIR/deploy.log"

echo "📂 Setting up Dedicated Persistent Linux Storage..." | tee -a "$LOG_DIR/deploy.log"
PARENT_DIR="$(cd "$PROJECT_DIR/.." && pwd)"
STORAGE_DIR="$PARENT_DIR/storage/uploads"

# Create external storage directory if not already existing
mkdir -p "$STORAGE_DIR"
chmod 755 "$STORAGE_DIR" 2>/dev/null || true

# Migrate any existing local images to external storage without overwriting
if [ -d "$PROJECT_DIR/public/uploads" ] && [ ! -L "$PROJECT_DIR/public/uploads" ]; then
    echo "📦 Migrating existing local photos to external storage..." | tee -a "$LOG_DIR/deploy.log"
    cp -rn "$PROJECT_DIR/public/uploads/." "$STORAGE_DIR/" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/public/uploads"
fi

# Create persistent symlinks
ln -sfn "$STORAGE_DIR" "$PROJECT_DIR/public/uploads" 2>&1 | tee -a "$LOG_DIR/deploy.log"
mkdir -p "$PROJECT_DIR/.next/standalone/.next/static"
cp -r "$PROJECT_DIR/.next/static/." "$PROJECT_DIR/.next/standalone/.next/static/" 2>&1 | tee -a "$LOG_DIR/deploy.log"
mkdir -p "$PROJECT_DIR/.next/standalone/public"
cp -r "$PROJECT_DIR/public/." "$PROJECT_DIR/.next/standalone/public/" 2>&1 | tee -a "$LOG_DIR/deploy.log"
ln -sfn "$STORAGE_DIR" "$PROJECT_DIR/.next/standalone/public/uploads" 2>&1 | tee -a "$LOG_DIR/deploy.log"

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
