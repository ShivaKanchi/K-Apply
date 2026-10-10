import { getQAList, createQAItem } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function GET() {
  try {
    const list = await getQAList();
    return jsonResponse({ success: true, qa: list });
  } catch (err) {
    console.error('[API qa GET error]:', err);
    return errorResponse('Failed to fetch QA list', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title || !body.answer) {
      return errorResponse('Title and Answer are required', 400);
    }
    const created = await createQAItem(body);
    return jsonResponse({ success: true, item: created }, 201);
  } catch (err) {
    console.error('[API qa POST error]:', err);
    return errorResponse('Failed to create QA item', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
