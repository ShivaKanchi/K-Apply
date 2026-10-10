import { checkConnectionStatus } from '@/lib/db-operations';
import { jsonResponse, corsHeaders } from '@/lib/cors';

export async function GET() {
  const status = await checkConnectionStatus();
  return jsonResponse(status);
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
