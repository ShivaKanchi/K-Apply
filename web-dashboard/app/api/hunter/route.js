import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { exec, spawn } from 'child_process';
import path from 'path';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

const HUNTER_DIR = path.resolve(process.cwd(), '..', 'JobHunter');

function runPythonCommand(args) {
  return new Promise((resolve, reject) => {
    const cmd = `python cli.py ${args.join(' ')}`;
    exec(cmd, { cwd: HUNTER_DIR, timeout: 35000 }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, error: error.message, stderr, stdout });
      }
      resolve({ success: true, stdout, stderr });
    });
  });
}

export async function GET() {
  const headers = corsHeaders();
  return NextResponse.json({
    success: true,
    module: 'K-Apply Hunter Autonomous Worker',
    status: 'operational',
    hunterDir: HUNTER_DIR,
    supportedPortals: ['greenhouse', 'lever', 'ashby', 'workday', 'linkedin']
  }, { headers });
}

export async function POST(request) {
  const headers = corsHeaders();

  try {
    const body = await request.json();
    const { action = 'intel', company = 'stripe', role = 'Full Stack Engineer', portal = 'auto', url = '', mode = 'review' } = body;

    // 1. Standalone Company Prep & Screening Question Intelligence
    if (action === 'intel') {
      const cleanCompany = company.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'stripe';
      const cleanRole = role.trim() || 'Full Stack Engineer';

      const result = await runPythonCommand(['intel', '--company', `"${cleanCompany}"`, '--role', `"${cleanRole}"`, '--json']);
      
      if (result.success && result.stdout) {
        try {
          const parsed = JSON.parse(result.stdout.trim());
          return NextResponse.json({
            success: true,
            action: 'intel',
            data: parsed,
            rawOutput: result.stdout
          }, { headers });
        } catch (e) {
          // If stdout had formatting artifacts, return structured text
          return NextResponse.json({
            success: true,
            action: 'intel',
            rawOutput: result.stdout
          }, { headers });
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Failed to generate question intelligence',
        error: result.error || result.stderr
      }, { status: 500, headers });
    }

    // 2. Full Autonomous Board Discovery (Hunt)
    if (action === 'hunt' || action === 'scan') {
      const cleanCompany = company.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'stripe';
      const cleanPortal = portal === 'auto' ? 'greenhouse' : portal;
      const cleanRole = role.trim() || 'Full Stack Engineer';

      const result = await runPythonCommand([
        'hunt',
        '--company', `"${cleanCompany}"`,
        '--portal', `"${cleanPortal}"`,
        '--role', `"${cleanRole}"`,
        '--json'
      ]);

      if (result.success && result.stdout) {
        try {
          const parsed = JSON.parse(result.stdout.trim());
          return NextResponse.json({
            success: true,
            action: 'hunt',
            company: cleanCompany,
            role: cleanRole,
            portal: cleanPortal,
            jobs: parsed.jobs || [],
            intel: parsed.intel || null
          }, { headers });
        } catch (e) {
          return NextResponse.json({
            success: true,
            action: 'hunt',
            rawOutput: result.stdout,
            jobs: []
          }, { headers });
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Hunter crawl completed with errors',
        error: result.error || result.stderr
      }, { status: 500, headers });
    }

    // 3. Playwright Background Worker Launch (HITL Mode)
    if (action === 'apply' || action === 'playwright') {
      if (!url) {
        return NextResponse.json({
          success: false,
          message: 'Apply URL is required for Playwright worker'
        }, { status: 400, headers });
      }

      const cleanRole = role.trim() || 'Full Stack Engineer';
      const cleanMode = mode === 'auto' ? 'auto' : 'review';

      // Spawn in background so it doesn't block HTTP request and desktop browser can open
      const child = spawn('python', ['cli.py', 'apply', '--url', url, '--role', cleanRole, '--mode', cleanMode], {
        cwd: HUNTER_DIR,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return NextResponse.json({
        success: true,
        action: 'playwright',
        message: `K-Apply Hunter Playwright worker spawned for ${cleanRole} at ${url} (${cleanMode.toUpperCase()} mode). Check your desktop window.`,
        url,
        mode: cleanMode
      }, { headers });
    }

    return NextResponse.json({
      success: false,
      message: `Unknown action: ${action}`
    }, { status: 400, headers });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: 'K-Apply Hunter API internal error',
      error: err.message
    }, { status: 500, headers });
  }
}
