#!/bin/bash

# Lost & Found Portal - Quick Setup Commands
# Run this on your school server after cloning the repo

echo "🚀 Lost & Found Portal - Quick Setup"
echo "======================================"
echo ""
echo "This will set up auto-startup and auto-deployment"
echo ""

# Step 1: Generate webhook secret
echo "Step 1: Generate Webhook Secret"
echo "--------------------------------"
SECRET=$(openssl rand -hex 32)
echo "Your webhook secret: $SECRET"
echo ""
echo "Save this secret! You'll need it for GitHub webhook configuration."
echo ""

# Step 2: Create .env.production.local
echo "Step 2: Create Environment File"
echo "--------------------------------"
read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY

cat > .env.production.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
SITE_URL=https://lost-n-found.dcism.org
NODE_ENV=production
PORT=20089
GITHUB_WEBHOOK_SECRET=$SECRET
EOF

echo "✅ Created .env.production.local"
echo ""

# Step 3: Make scripts executable
echo "Step 3: Make Scripts Executable"
echo "--------------------------------"
chmod +x deploy-pm2.sh
chmod +x auto-deploy.sh
echo "✅ Scripts are now executable"
echo ""

# Step 4: Run deployment
echo "Step 4: Deploy Application"
echo "--------------------------------"
echo "Running deploy-pm2.sh (option 1 - First time deployment)..."
echo ""
bash deploy-pm2.sh << EOF
1
EOF

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure GitHub Webhook:"
echo "   - Go to: https://github.com/GRONK13/lost-and-found/settings/hooks"
echo "   - Add webhook"
echo "   - Payload URL: https://lost-n-found.dcism.org/api/deploy"
echo "   - Content type: application/json"
echo "   - Secret: $SECRET"
echo "   - Events: Just the push event"
echo ""
echo "2. Test the setup:"
echo "   - Server auto-startup: sudo reboot (then check: pm2 status)"
echo "   - Auto-deployment: git push to main branch"
echo ""
echo "3. Monitor deployments:"
echo "   - View logs: tail -f logs/deploy.log"
echo "   - PM2 status: pm2 status"
echo "   - PM2 logs: pm2 logs lost-and-found"
echo ""
echo "🌐 Your app is live at: https://lost-n-found.dcism.org"
echo ""
