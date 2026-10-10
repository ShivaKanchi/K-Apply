import { generateAIAnswer } from '@/lib/ai-service';
import { getProfile } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, company, role, model } = body;

    if (!question) {
      return errorResponse('Question is required', 400);
    }

    const profile = await getProfile();
    const result = await generateAIAnswer({
      question,
      company: company || '',
      role: role || '',
      profile: profile || {},
      modelOverride: model || ''
    });

    return jsonResponse({
      success: true,
      answer: result.answer,
      source: result.source,
      isFallback: result.isFallback
    });
  } catch (err) {
    console.error('[API ai/answer POST error]:', err);
    return errorResponse('Failed to generate answer', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
