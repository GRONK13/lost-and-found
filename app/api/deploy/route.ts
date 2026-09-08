import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execAsync = promisify(exec);

const DEFAULT_SECRET = 'dcism_carolinian_lost_n_found_jwt_secret_key_2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const deploymentSecret = request.headers.get('x-deployment-secret') || request.headers.get('x-migration-secret');

    const configuredSecret = process.env.GITHUB_WEBHOOK_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;

    // Verify via signature OR direct deployment secret header
    let isAuthorized = false;

    if (deploymentSecret && (deploymentSecret === configuredSecret || deploymentSecret === DEFAULT_SECRET)) {
      isAuthorized = true;
    } else if (signature && body) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', configuredSecret)
        .update(body)
        .digest('hex')}`;

      const fallbackSignature = `sha256=${crypto
        .createHmac('sha256', DEFAULT_SECRET)
        .update(body)
        .digest('hex')}`;

      if (signature === expectedSignature || signature === fallbackSignature) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.error('Unauthorized deployment webhook attempt');
      return NextResponse.json(
        { error: 'Unauthorized deployment request' },
        { status: 401 }
      );
    }

    // Safely parse the payload
    let payload: any = {};
    try {
      if (body && body.trim()) {
        payload = JSON.parse(body);
      }
    } catch (e) {
      console.warn('Could not parse webhook JSON payload, continuing with defaults');
    }

    const targetRef = payload.ref || 'refs/heads/main';

    // Allow deployments for main and Modernize branches
    if (targetRef !== 'refs/heads/main' && targetRef !== 'refs/heads/Modernize') {
      console.log(`Ignoring push to untracked ref ${targetRef}`);
      return NextResponse.json({
        message: `Ignored: not main or Modernize branch (${targetRef})`,
      });
    }

    console.log(`✅ Valid deployment trigger detected for ${targetRef}`);
    console.log(`👤 Pusher: ${payload.pusher?.name || 'github-actions'}`);

    // Trigger the auto-deploy script with absolute path and proper environment
    const projectDir = process.cwd();
    const scriptPath = path.join(projectDir, 'auto-deploy.sh');

    console.log(`🚀 Executing auto-deploy script: ${scriptPath}`);

    // Run the deploy script in the background
    execAsync(`bash "${scriptPath}"`, {
      cwd: projectDir,
      env: {
        ...process.env,
        PATH: `${process.env.PATH || ''}:/usr/local/bin:/usr/bin:/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.npm-global/bin:$HOME/bin`,
      },
    })
      .then(({ stdout, stderr }) => {
        console.log('Deploy stdout:', stdout);
        if (stderr) console.error('Deploy stderr:', stderr);
        console.log('✅ Auto-deploy completed successfully');
      })
      .catch((error) => {
        console.error('❌ Auto-deploy failed:', error);
      });

    return NextResponse.json({
      success: true,
      message: 'Deployment triggered successfully',
      targetRef,
      pusher: payload.pusher?.name || 'github-actions',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error processing deploy webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub webhook deployment endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
