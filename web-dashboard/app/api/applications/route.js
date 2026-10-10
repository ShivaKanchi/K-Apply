import { getApplications, createApplication } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = status && status !== 'all' ? { status } : {};
    
    const items = await getApplications(query);
    return jsonResponse({ success: true, applications: items });
  } catch (err) {
    console.error('[API applications GET error]:', err);
    return errorResponse('Failed to fetch applications', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.company || !body.role) {
      return errorResponse('Company and Role are required', 400);
    }
    const created = await createApplication(body);
    return jsonResponse({ success: true, application: created }, 201);
  } catch (err) {
    console.error('[API applications POST error]:', err);
    return errorResponse('Failed to create application', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
