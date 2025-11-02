# PM2 Deployment Guide for Lost & Found Portal

This guide covers deploying the Lost & Found Portal on your school server using PM2 (Process Manager 2).

## Prerequisites

- Node.js (v18 or higher) installed on the server
- npm or yarn package manager
- Git installed
- SSH access to your school server
- A subdomain allocated to you (e.g., `lost-and-found.yourusername.school.edu`)

## Installation Steps

### 1. Install PM2 Globally (if not already installed)

```bash
npm install -g pm2
```

Verify PM2 is installed:
```bash
pm2 --version
```

### 2. Clone the Repository

SSH into your school server and clone the repository:

```bash
cd ~
git clone https://github.com/GRONK13/lost-and-found.git
cd lost-and-found
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.production.local` file:

```bash
nano .env.production.local
```

Add your environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SITE_URL=https://lost-and-found.yourusername.school.edu
NODE_ENV=production
PORT=3000
```

Save and exit (Ctrl+X, then Y, then Enter)

### 5. Build the Application

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.

### 6. Create Logs Directory

```bash
mkdir -p logs
```

### 7. Start the Application with PM2

```bash
pm2 start ecosystem.config.js
```

### 8. Save PM2 Process List

To ensure your app starts automatically after server reboots:

```bash
pm2 save
pm2 startup
```

Follow the instructions provided by the `pm2 startup` command (it will give you a command to run with sudo).

## PM2 Management Commands

### View Application Status
```bash
pm2 status
```

### View Logs
```bash
# View all logs
pm2 logs lost-and-found

# View only error logs
pm2 logs lost-and-found --err

# View last 100 lines
pm2 logs lost-and-found --lines 100

# Clear logs
pm2 flush
```

### Restart Application
```bash
pm2 restart lost-and-found
```

### Stop Application
```bash
pm2 stop lost-and-found
```

### Delete Application from PM2
```bash
pm2 delete lost-and-found
```

### Reload Application (Zero Downtime)
```bash
pm2 reload lost-and-found
```

### Monitor Resource Usage
```bash
pm2 monit
```

## Updating the Application

When you have new changes to deploy:

```bash
# 1. Navigate to project directory
cd ~/lost-and-found

# 2. Pull latest changes
git pull origin main

# 3. Install new dependencies (if any)
npm install

# 4. Rebuild the application
npm run build

# 5. Reload with PM2 (zero downtime)
pm2 reload lost-and-found
```

## Setting Up Reverse Proxy with Nginx

Your school server likely uses Nginx or Apache. Here's how to configure Nginx:

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/lost-and-found
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name lost-and-found.yourusername.school.edu;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lost-and-found.yourusername.school.edu;

    # SSL certificates (adjust path based on your school's setup)
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Supabase storage proxy (for images)
    location ~ ^/storage/.* {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

### 2. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/lost-and-found /etc/nginx/sites-enabled/
```

### 3. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Using a Different Port

If port 3000 is already in use, you can change it:

### 1. Update `.env.production.local`
```env
PORT=3001
```

### 2. Update `ecosystem.config.js`
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
}
```

### 3. Update Nginx proxy_pass
```nginx
proxy_pass http://localhost:3001;
```

### 4. Rebuild and restart
```bash
npm run build
pm2 restart lost-and-found
sudo systemctl reload nginx
```

## Troubleshooting

### Application Won't Start

Check the logs:
```bash
pm2 logs lost-and-found --lines 50
```

Common issues:
- Missing environment variables
- Port already in use
- Build errors
- Supabase connection issues

### High Memory Usage

Restart the application:
```bash
pm2 restart lost-and-found
```

Or adjust max memory in `ecosystem.config.js`:
```javascript
max_memory_restart: '512M',  // Reduce if needed
```

### Application Crashes on Server Reboot

Make sure PM2 startup is configured:
```bash
pm2 save
pm2 startup
```

### Cannot Connect to Supabase

Verify:
1. Environment variables are correct
2. Server has internet access
3. Supabase URL and keys are valid
4. RLS policies are configured in Supabase

### Nginx 502 Bad Gateway

Check if the app is running:
```bash
pm2 status
```

Verify the port matches:
```bash
pm2 logs lost-and-found | grep PORT
```

## Performance Optimization

### 1. Enable Cluster Mode (for better performance)

Update `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster',
```

Restart:
```bash
pm2 reload lost-and-found
```

### 2. Enable Nginx Caching

Add to your Nginx config:
```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Monitor Performance

```bash
# CPU and memory usage
pm2 monit

# Detailed info
pm2 show lost-and-found
```

## Database Migrations

Before first deployment, run these SQL scripts in Supabase:

1. `db/schema.sql` (if starting fresh)
2. `db/policies.sql`
3. `db/migration_add_chat_type.sql`
4. `db/migration_add_message_read_status.sql`

## Deployment Checklist

- [ ] Node.js and PM2 installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.production.local`)
- [ ] Database migrations run in Supabase
- [ ] Application built (`npm run build`)
- [ ] PM2 started (`pm2 start ecosystem.config.js`)
- [ ] PM2 saved (`pm2 save`)
- [ ] PM2 startup configured
- [ ] Nginx configured and reloaded
- [ ] SSL certificate configured
- [ ] Application accessible via subdomain
- [ ] Tested all features (login, items, chat, claims)

## Monitoring and Maintenance

### Set up PM2 Log Rotation

```bash
pm2 install pm2-logrotate
```

Configure log rotation:
```bash
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Regular Maintenance Tasks

1. **Weekly**: Check logs for errors
   ```bash
   pm2 logs lost-and-found --err --lines 100
   ```

2. **Monthly**: Update dependencies
   ```bash
   npm update
   npm run build
   pm2 reload lost-and-found
   ```

3. **Quarterly**: Check Supabase database size and performance

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs lost-and-found`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables
4. Test Supabase connection
5. Check GitHub issues

## Quick Reference

```bash
# Start app
pm2 start ecosystem.config.js

# Stop app
pm2 stop lost-and-found

# Restart app
pm2 restart lost-and-found

# View logs
pm2 logs lost-and-found

# Monitor
pm2 monit

# Update and redeploy
git pull && npm install && npm run build && pm2 reload lost-and-found
```
