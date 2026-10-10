import { updateApplication, deleteApplication } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const updated = await updateApplication(id, body);
    if (!updated) {
      return errorResponse('Application not found', 404);
    }
    return jsonResponse({ success: true, application: updated });
  } catch (err) {
    console.error('[API applications PUT error]:', err);
    return errorResponse('Failed to update application', 500, err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const deleted = await deleteApplication(id);
    if (!deleted) {
      return errorResponse('Application not found or already deleted', 404);
    }
    return jsonResponse({ success: true, message: 'Application deleted' });
  } catch (err) {
    console.error('[API applications DELETE error]:', err);
    return errorResponse('Failed to delete application', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
