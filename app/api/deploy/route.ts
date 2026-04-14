import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execAsync = promisify(exec);

/**
 * GitHub Webhook Handler for Auto-Deployment
 * 
 * This endpoint receives push events from GitHub and triggers auto-deployment
 * when changes are pushed to the main branch.
 * 
 * Setup:
 * 1. Add GITHUB_WEBHOOK_SECRET to .env.production.local
 * 2. Configure webhook in GitHub repo settings:
 *    - URL: https://your-domain.com/api/deploy
 *    - Content type: application/json
 *    - Secret: (same as GITHUB_WEBHOOK_SECRET)
 *    - Events: Just the push event
 */

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    // Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('GITHUB_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      console.error('No signature provided in webhook request');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 401 }
      );
    }
    
    // Verify the signature
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')}`;
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse the payload
    const payload = JSON.parse(body);
    
    // Only deploy on push to main branch
    if (payload.ref !== 'refs/heads/main') {
      console.log(`Ignoring push to ${payload.ref}`);
      return NextResponse.json({
        message: `Ignored: not main branch (${payload.ref})`,
      });
    }
    
    console.log(`✅ Valid push to main branch detected`);
    console.log(`📦 Commits: ${payload.commits?.length || 0}`);
    console.log(`👤 Pusher: ${payload.pusher?.name || 'unknown'}`);
    
    // Trigger the auto-deploy script
    const scriptPath = './auto-deploy.sh';
    
    console.log(`🚀 Triggering auto-deploy: ${scriptPath}`);
    
    // Run the deploy script in the background
    execAsync(`bash ${scriptPath}`)
      .then(({ stdout, stderr }) => {
        console.log('Deploy stdout:', stdout);
        if (stderr) console.error('Deploy stderr:', stderr);
        console.log('✅ Auto-deploy completed successfully');
      })
      .catch((error) => {
        console.error('❌ Auto-deploy failed:', error);
      });
    
    // Return immediately (deploy runs in background)
    return NextResponse.json({
      message: 'Deployment triggered',
      ref: payload.ref,
      commits: payload.commits?.length || 0,
      pusher: payload.pusher?.name || 'unknown',
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
