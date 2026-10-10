import { updateQAItem, deleteQAItem } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const updated = await updateQAItem(id, body);
    if (!updated) {
      return errorResponse('QA item not found', 404);
    }
    return jsonResponse({ success: true, item: updated });
  } catch (err) {
    console.error('[API qa PUT error]:', err);
    return errorResponse('Failed to update QA item', 500, err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const deleted = await deleteQAItem(id);
    if (!deleted) {
      return errorResponse('QA item not found or already deleted', 404);
    }
    return jsonResponse({ success: true, message: 'QA item deleted' });
  } catch (err) {
    console.error('[API qa DELETE error]:', err);
    return errorResponse('Failed to delete QA item', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
