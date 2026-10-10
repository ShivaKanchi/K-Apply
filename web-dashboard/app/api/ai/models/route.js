import { checkOllamaConnection } from '@/lib/ai-service';
import { jsonResponse, corsHeaders } from '@/lib/cors';

export async function GET() {
  const status = await checkOllamaConnection();
  return jsonResponse(status);
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
