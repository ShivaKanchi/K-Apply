import { seedDatabase } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function POST(request) {
  try {
    let force = false;
    try {
      const body = await request.json();
      force = Boolean(body?.force);
    } catch (e) {
      // Body empty is fine
    }

    const result = await seedDatabase(force);
    return jsonResponse({
      success: true,
      message: 'Database initialized successfully with blank profile and Q&A templates',
      result
    });
  } catch (err) {
    console.error('[API seed POST error]:', err);
    return errorResponse('Failed to seed database', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
