import { generateAICoverLetter } from '@/lib/ai-service';
import { getProfile } from '@/lib/db-operations';
import { jsonResponse, errorResponse, corsHeaders } from '@/lib/cors';

export async function POST(request) {
  try {
    const body = await request.json();
    const { company, role, jobDescription, customInstructions, model } = body;

    if (!company) {
      return errorResponse('Company name is required', 400);
    }

    const profile = await getProfile();
    const result = await generateAICoverLetter({
      company,
      role: role || 'Full Stack Developer',
      jobDescription: jobDescription || '',
      customInstructions: customInstructions || '',
      profile: profile || {},
      modelOverride: model || ''
    });

    return jsonResponse({
      success: true,
      coverLetter: result.content,
      source: result.source,
      model: result.model,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason || null
    });
  } catch (err) {
    console.error('[API ai/cover-letter POST error]:', err);
    return errorResponse('Failed to generate cover letter', 500, err.message);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}
