#!/bin/bash

# Auto-deployment script triggered by GitHub webhook
# This script pulls latest code, builds, and reloads PM2

set -e

echo "🔄 Auto-Deploy Triggered - $(date)" | tee -a logs/deploy.log

# Navigate to project directory
cd "$(dirname "$0")"

# Pull latest changes
echo "⬇️  Pulling latest changes from main..." | tee -a logs/deploy.log
git pull origin main 2>&1 | tee -a logs/deploy.log

# Install dependencies (in case package.json changed)
echo "📦 Installing dependencies..." | tee -a logs/deploy.log
npm install 2>&1 | tee -a logs/deploy.log

# Build the application
echo "🔨 Building application..." | tee -a logs/deploy.log
npm run build 2>&1 | tee -a logs/deploy.log

# Reload PM2 with zero downtime
echo "🔄 Reloading PM2 (zero downtime)..." | tee -a logs/deploy.log
pm2 reload lost-and-found 2>&1 | tee -a logs/deploy.log

echo "✅ Auto-deploy completed successfully - $(date)" | tee -a logs/deploy.log
echo "----------------------------------------" | tee -a logs/deploy.log
