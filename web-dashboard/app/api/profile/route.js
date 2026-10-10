import { getProfile, saveProfile } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function GET() {
  try {
    const profile = await getProfile();
    return jsonResponse({ success: true, profile });
  } catch (err) {
    console.error('[API profile GET error]:', err);
    return errorResponse('Failed to fetch profile', 500, err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const updated = await saveProfile(body);
    return jsonResponse({ success: true, profile: updated });
  } catch (err) {
    console.error('[API profile PUT error]:', err);
    return errorResponse('Failed to update profile', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
