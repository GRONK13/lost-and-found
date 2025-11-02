# Quick PM2 Deployment Guide

## Initial Setup (First Time)

### 1. Install PM2
```bash
npm install -g pm2
```

### 2. Configure Environment
```bash
# Create environment file
nano .env.production.local
```

Add these variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SITE_URL=https://your-subdomain.school.edu
NODE_ENV=production
PORT=3000
```

### 3. Deploy
```bash
# Make script executable
chmod +x deploy-pm2.sh

# Run deployment
./deploy-pm2.sh
# Select option 1 for first time deployment
```

## Quick Commands

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop lost-and-found

# Restart
pm2 restart lost-and-found

# View logs
pm2 logs lost-and-found

# Monitor
pm2 monit

# Status
pm2 status
```

## Update Deployment

```bash
# Option 1: Use script
./deploy-pm2.sh
# Select option 2 for update

# Option 2: Manual
git pull origin main
npm install
npm run build
pm2 reload lost-and-found
```

## Auto-start on Server Reboot

```bash
pm2 save
pm2 startup
# Run the command it gives you
```

## Troubleshooting

View detailed logs:
```bash
pm2 logs lost-and-found --lines 100
```

Check if app is running:
```bash
pm2 status
```

For more details, see `PM2_DEPLOYMENT.md`
