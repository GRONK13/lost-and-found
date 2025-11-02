# Docker Deployment Guide for Lost & Found Portal

## Prerequisites

- Docker installed on your server
- Docker Compose installed
- Supabase account with a configured database
- Your environment variables ready

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/GRONK13/lost-and-found.git
cd lost-and-found
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SITE_URL=https://yourdomain.com
```

### 3. Run Database Migrations

Before deploying, make sure your Supabase database has the required tables and columns:

1. Go to your Supabase Dashboard → SQL Editor
2. Run the following migration files in order:
   - `db/schema.sql` (if starting fresh)
   - `db/policies.sql`
   - `db/migration_add_chat_type.sql`
   - `db/migration_add_message_read_status.sql`

### 4. Build and Run with Docker Compose

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f app
```

The application will be available at `http://localhost:3000`

### 5. Production Deployment

For production deployment with a reverse proxy (recommended):

#### Option A: Using Nginx

Create an Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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
    }
}
```

Then enable SSL with Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

#### Option B: Docker Compose with Traefik

Update your `docker-compose.yml` to include Traefik labels for automatic SSL:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
        SITE_URL: ${SITE_URL}
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SITE_URL=${SITE_URL}
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
```

## Useful Docker Commands

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Restart the application
docker-compose restart app

# View running containers
docker ps

# Execute commands in the container
docker-compose exec app sh

# Remove all containers and images (clean slate)
docker-compose down --rmi all --volumes
```

## Updating the Application

When you have new changes to deploy:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Check if update was successful
docker-compose logs -f app
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, modify the `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Change 8080 to any available port
```

### Environment Variables Not Loading

Make sure your `.env` file is in the same directory as `docker-compose.yml` and contains all required variables.

### Build Errors

Try rebuilding without cache:

```bash
docker-compose build --no-cache
```

### Database Connection Issues

Verify your Supabase URL and keys are correct:
- Check Supabase Dashboard → Settings → API
- Ensure RLS policies are properly configured
- Verify network connectivity to Supabase

### Container Keeps Restarting

Check the logs for errors:

```bash
docker-compose logs app
```

Common issues:
- Missing environment variables
- Invalid Supabase credentials
- Port conflicts

## Performance Optimization

For production, consider:

1. **Enable Gzip Compression** in your reverse proxy
2. **Set up CDN** for static assets
3. **Configure Caching Headers** in Nginx/Traefik
4. **Monitor Resource Usage**:
   ```bash
   docker stats app
   ```

## Security Checklist

- [ ] Use HTTPS in production (SSL certificate)
- [ ] Keep Supabase credentials secure (never commit to git)
- [ ] Enable RLS policies in Supabase
- [ ] Use environment variables for sensitive data
- [ ] Regularly update dependencies (`npm audit fix`)
- [ ] Keep Docker images updated
- [ ] Configure firewall rules on your server
- [ ] Set up regular database backups in Supabase

## Monitoring

Monitor your application:

```bash
# Container health
docker-compose ps

# Resource usage
docker stats

# Application logs
docker-compose logs -f app --tail=100
```

## Backup

Important files to backup:
- `.env` (store securely, not in git)
- Supabase database (configure automatic backups in Supabase Dashboard)

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f app`
2. Verify environment variables
3. Check Supabase connection
4. Review the GitHub repository issues
