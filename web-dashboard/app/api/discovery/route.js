import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getProfile } from '@/lib/db-operations';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request) {
  const headers = corsHeaders();

  try {
    const { company, portal = 'auto', role = 'Full Stack' } = await request.json();

    if (!company) {
      return NextResponse.json(
        { success: false, message: 'Company name/slug is required' },
        { status: 400, headers }
      );
    }

    const slug = company.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let jobs = [];

    // Helper to query Greenhouse
    async function queryGreenhouse(compSlug) {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${compSlug}/jobs?content=true`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          next: { revalidate: 300 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.jobs || []).map(j => ({
          id: `gh_${j.id}`,
          title: j.title,
          company: company,
          portal: 'greenhouse',
          location: j.location?.name || 'Remote / Multiple',
          apply_url: j.absolute_url,
          departments: (j.departments || []).map(d => d.name),
          content: j.content || '',
          updated_at: j.updated_at
        }));
      } catch (e) {
        return [];
      }
    }

    // Helper to query Lever
    async function queryLever(compSlug) {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${compSlug}?mode=json`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          next: { revalidate: 300 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data.map(j => ({
          id: `lever_${j.id}`,
          title: j.text,
          company: company,
          portal: 'lever',
          location: j.categories?.location || j.workplaceType || 'Remote',
          apply_url: j.hostedUrl || j.applyUrl,
          departments: [j.categories?.team, j.categories?.department].filter(Boolean),
          content: j.descriptionPlain || j.description || '',
          updated_at: j.createdAt ? new Date(j.createdAt).toISOString() : ''
        }));
      } catch (e) {
        return [];
      }
    }

    // Helper to query Ashby
    async function queryAshby(compSlug) {
      try {
        const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${compSlug}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          next: { revalidate: 300 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.jobs || []).map(j => ({
          id: `ashby_${j.id}`,
          title: j.title,
          company: company,
          portal: 'ashby',
          location: j.location || (j.isRemote ? 'Remote' : 'On-site'),
          apply_url: j.jobUrl || `https://jobs.ashbyhq.com/${compSlug}/${j.id}`,
          departments: [j.department].filter(Boolean),
          content: j.descriptionPlain || '',
          updated_at: j.publishedAt
        }));
      } catch (e) {
        return [];
      }
    }

    // Execute query based on portal
    if (portal === 'greenhouse') {
      jobs = await queryGreenhouse(slug);
    } else if (portal === 'lever') {
      jobs = await queryLever(slug);
    } else if (portal === 'ashby') {
      jobs = await queryAshby(slug);
    } else {
      // Auto: Try Greenhouse, then Lever, then Ashby
      jobs = await queryGreenhouse(slug);
      if (jobs.length === 0) jobs = await queryLever(slug);
      if (jobs.length === 0) jobs = await queryAshby(slug);
    }

    // Retrieve candidate profile to calculate match score
    const profile = await getProfile();
    const candidateSkills = (profile?.skills || [
      'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'MongoDB', 'Tailwind CSS',
      'REST APIs', 'Full Stack', 'Frontend', 'Web Development', 'Git', 'Redux'
    ]).map(s => s.toLowerCase());

    const roleTokens = role.toLowerCase().split(/\s+/).filter(Boolean);

    // Score jobs
    const scoredJobs = jobs.map(j => {
      const textToSearch = `${j.title} ${j.content} ${j.departments?.join(' ')}`.toLowerCase();
      
      const matchedSkills = candidateSkills.filter(skill => textToSearch.includes(skill));
      const matchedRoleTokens = roleTokens.filter(token => j.title.toLowerCase().includes(token));
      const roleRelevancy = roleTokens.length > 0 ? (matchedRoleTokens.length / roleTokens.length) : 0.5;

      let score = Math.round(
        (matchedSkills.length / Math.max(candidateSkills.length * 0.4, 4)) * 60 +
        (roleRelevancy * 40)
      );

      score = Math.min(98, Math.max(35, score));

      return {
        ...j,
        matchScore: score,
        matchedSkills: matchedSkills.slice(0, 5)
      };
    });

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      company,
      portalFound: jobs.length > 0 ? jobs[0].portal : portal,
      count: scoredJobs.length,
      jobs: scoredJobs.slice(0, 30)
    }, { headers });

  } catch (error) {
    console.error('Job discovery API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Job discovery failed' },
      { status: 500, headers }
    );
  }
}
