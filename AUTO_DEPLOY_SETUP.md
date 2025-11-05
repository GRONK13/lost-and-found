# Auto-Deployment & Auto-Startup Setup Guide

This guide explains how to set up automatic server startup and GitHub auto-deployment for the Lost & Found Portal.

## 🚀 Auto-Startup on Server Boot

When the server restarts (e.g., after a power outage), the app will automatically start using PM2.

### Setup Steps

1. **Deploy the app first** (if not already deployed):
   ```bash
   bash deploy-pm2.sh
   # Select option 1 (First time deployment)
   ```

2. **PM2 startup is configured automatically** during first deployment. The script will:
   - Generate the PM2 startup script
   - Save the current PM2 process list
   - Configure auto-start on server boot

3. **Verify auto-startup is configured**:
   ```bash
   pm2 startup
   ```
   
   You should see: "PM2 resurrection setup already exists"

4. **Test it** (optional):
   ```bash
   # Reboot the server
   sudo reboot
   
   # After reboot, check PM2 status
   pm2 status
   # You should see "lost-and-found" running
   ```

### Manual Setup (if needed)

If auto-startup didn't configure automatically:

```bash
# Generate startup script
pm2 startup

# The command will output something like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username

# Copy and run that command exactly as shown
sudo env PATH=$PATH:...  # (paste the full command)

# Save PM2 process list
pm2 save
```

## 🔄 GitHub Auto-Deployment

Set up automatic deployment when you push to the main branch (like Vercel).

### How It Works

1. You push code to GitHub main branch
2. GitHub sends a webhook to your server
3. Server receives the webhook at `/api/deploy`
4. Server pulls latest code, builds, and reloads PM2
5. App updates with zero downtime! 🎉

### Setup Steps

#### 1. Generate a Webhook Secret

Generate a random secret key:

```bash
# On Linux/Mac
openssl rand -hex 32

# Or use an online generator
# https://www.random.org/strings/
```

Copy the generated secret.

#### 2. Add Secret to Environment Variables

Edit your `.env.production.local` file:

```bash
nano .env.production.local
# or
vim .env.production.local
```

Add this line:
```env
GITHUB_WEBHOOK_SECRET=your_generated_secret_here
```

Save and exit.

#### 3. Rebuild and Reload the App

```bash
npm run build
pm2 reload lost-and-found
```

#### 4. Configure GitHub Webhook

Go to your GitHub repository:

1. **Navigate to Settings**:
   - Go to: `https://github.com/GRONK13/lost-and-found/settings/hooks`
   - Or: Repository → Settings → Webhooks → Add webhook

2. **Configure the webhook**:
   
   | Field | Value |
   |-------|-------|
   | Payload URL | `https://lost-n-found.dcism.org/api/deploy` |
   | Content type | `application/json` |
   | Secret | (paste the secret you generated in step 1) |
   | SSL verification | Enable SSL verification |
   | Which events? | Just the `push` event |
   | Active | ✅ Checked |

3. **Click "Add webhook"**

#### 5. Test the Webhook

**Option A: Test from GitHub**

1. Go to your webhook settings
2. Click on the webhook you just created
3. Scroll to "Recent Deliveries"
4. Click "Redeliver" on any delivery (or push a test commit)
5. Check response shows 200 OK

**Option B: Make a test commit**

```bash
# Make a small change
echo "# Test auto-deploy" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger auto-deploy"
git push origin main
```

#### 6. Verify Deployment

Check the deployment logs:

```bash
# View deploy logs
tail -f logs/deploy.log

# View PM2 logs
pm2 logs lost-and-found --lines 50
```

You should see:
- ✅ Pull from GitHub
- ✅ npm install
- ✅ Build success
- ✅ PM2 reload

### Webhook Endpoint Details

The webhook endpoint is at: `app/api/deploy/route.ts`

**Features:**
- ✅ Signature verification (secure)
- ✅ Only deploys on main branch pushes
- ✅ Logs all deployment activity
- ✅ Runs deployment in background
- ✅ Zero downtime reload with PM2

**Test the endpoint:**
```bash
# Health check (should return 200 OK)
curl https://lost-n-found.dcism.org/api/deploy
```

## 📋 Deployment Logs

Monitor deployment activity:

```bash
# View auto-deploy logs
tail -f logs/deploy.log

# View PM2 app logs
pm2 logs lost-and-found

# View PM2 error logs only
pm2 logs lost-and-found --err

# Clear logs
pm2 flush
```

## 🔧 Troubleshooting

### Auto-Startup Not Working

**Problem**: App doesn't start after server reboot

**Solutions**:
```bash
# Re-configure startup
pm2 unstartup
pm2 startup
# Run the command it provides
pm2 save

# Check if systemd service is active (Linux)
systemctl status pm2-username
```

### Webhook Returns 401 (Unauthorized)

**Problem**: GitHub webhook fails with 401 error

**Solutions**:
- Verify `GITHUB_WEBHOOK_SECRET` matches in both `.env.production.local` and GitHub webhook settings
- Rebuild app after adding secret: `npm run build && pm2 reload lost-and-found`
- Check webhook secret has no extra spaces or quotes

### Webhook Returns 500 (Server Error)

**Problem**: Webhook endpoint crashes

**Solutions**:
```bash
# Check PM2 logs for errors
pm2 logs lost-and-found --err

# Verify auto-deploy.sh has execute permissions
chmod +x auto-deploy.sh

# Test auto-deploy script manually
bash auto-deploy.sh
```

### Deployment Doesn't Trigger

**Problem**: Push to main but no deployment happens

**Solutions**:
- Check GitHub webhook deliveries for errors
- Verify webhook is active (green checkmark in GitHub)
- Check logs: `tail -f logs/deploy.log`
- Ensure pushing to `main` branch (not `master` or other)

### Git Pull Fails During Auto-Deploy

**Problem**: Auto-deploy script fails on git pull

**Solutions**:
```bash
# Check git status
git status

# Ensure working directory is clean
git stash

# Verify git remote
git remote -v

# Test git pull manually
git pull origin main
```

## 🎯 Quick Reference

### Daily Usage

```bash
# View app status
pm2 status

# View logs
pm2 logs lost-and-found

# Manual restart (if needed)
pm2 restart lost-and-found

# View recent deployments
tail -20 logs/deploy.log
```

### After Server Reboot

**Nothing to do!** The app starts automatically. Just verify:

```bash
pm2 status
# Should show "lost-and-found" as "online"
```

### After Pushing to GitHub

**Nothing to do!** The app deploys automatically. Monitor logs:

```bash
tail -f logs/deploy.log
```

## ✅ Verification Checklist

After setup, verify these features:

- [ ] App starts after server reboot
- [ ] `pm2 status` shows app running
- [ ] GitHub webhook shows green checkmark
- [ ] Test push triggers deployment
- [ ] `logs/deploy.log` shows successful deployments
- [ ] App reloads with zero downtime
- [ ] Site accessible at https://lost-n-found.dcism.org

---

**🎉 Congratulations!** Your Lost & Found Portal now:
- ✅ Auto-starts on server boot
- ✅ Auto-deploys on GitHub push to main
- ✅ Has zero downtime deployments
- ✅ Logs all deployment activity

Just push your code and let GitHub handle the rest! 🚀
