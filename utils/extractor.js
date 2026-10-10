/**
 * Job Metadata Extractor
 * Extracts Company Name, Role/Job Title, Location, and Application URL from current page
 */

export function extractJobDetails() {
  const result = {
    company: '',
    role: '',
    location: '',
    url: window.location.href,
    source: 'web'
  };

  try {
    // 1. Try JSON-LD schema.org/JobPosting
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.innerText);
        const posting = Array.isArray(data) ? data.find(item => item['@type'] === 'JobPosting') : (data['@type'] === 'JobPosting' ? data : null);
        if (posting) {
          if (posting.title && !result.role) result.role = posting.title;
          if (posting.hiringOrganization?.name && !result.company) {
            result.company = posting.hiringOrganization.name;
          }
          if (posting.jobLocation?.address && !result.location) {
            const addr = posting.jobLocation.address;
            result.location = typeof addr === 'string' ? addr : [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ');
          }
          if (result.role && result.company) return cleanJobDetails(result);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    const host = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname;

    // 2. Platform-Specific Heuristics:

    // --- Greenhouse ---
    if (host.includes('greenhouse.io') || document.querySelector('#embedded_job_board, #application_form')) {
      result.source = 'Greenhouse';
      const companyEl = document.querySelector('.company-name, .logo img[alt], #header .company-name');
      const titleEl = document.querySelector('.app-title, h1.app-title, .job-title');
      const locEl = document.querySelector('.location, .job-location');
      
      if (companyEl) result.company = companyEl.innerText || companyEl.getAttribute('alt') || '';
      if (titleEl) result.role = titleEl.innerText;
      if (locEl) result.location = locEl.innerText;

      // URL fallback for Greenhouse: boards.greenhouse.io/<company>/jobs/...
      if (!result.company) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length > 0) result.company = capitalize(parts[0]);
      }
    }

    // --- Lever ---
    else if (host.includes('lever.co')) {
      result.source = 'Lever';
      const titleEl = document.querySelector('.posting-headline h2');
      const locEl = document.querySelector('.posting-categories .location, .posting-category.location');
      const companyLogo = document.querySelector('.main-header-logo img, .header-logo img');

      if (titleEl) result.role = titleEl.innerText;
      if (locEl) result.location = locEl.innerText;
      if (companyLogo) result.company = companyLogo.getAttribute('alt') || '';

      // URL fallback: jobs.lever.co/<company>/<id>
      if (!result.company) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length > 0) result.company = capitalize(parts[0]);
      }
    }

    // --- Ashby ---
    else if (host.includes('ashbyhq.com')) {
      result.source = 'Ashby';
      const titleEl = document.querySelector('h1');
      if (titleEl) result.role = titleEl.innerText;
      
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) result.company = capitalize(parts[0]);
    }

    // --- Workday ---
    else if (host.includes('workday.com') || host.includes('myworkdayjobs.com')) {
      result.source = 'Workday';
      const titleEl = document.querySelector('[data-automation-id="jobPostingHeader"], [data-automation-id="jobTitle"]');
      const locEl = document.querySelector('[data-automation-id="jobPostingLocation"]');
      if (titleEl) result.role = titleEl.innerText;
      if (locEl) result.location = locEl.innerText;
      
      // subdomain extraction
      const sub = host.split('.')[0];
      if (sub && sub !== 'jobs' && sub !== 'myworkdayjobs') result.company = capitalize(sub);
    }

    // --- LinkedIn ---
    else if (host.includes('linkedin.com')) {
      result.source = 'LinkedIn';
      const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .topcard__title');
      const compEl = document.querySelector('.job-details-jobs-unified-top-card__company-name, .topcard__org-name-link');
      const locEl = document.querySelector('.job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet');
      
      if (titleEl) result.role = titleEl.innerText;
      if (compEl) result.company = compEl.innerText;
      if (locEl) result.location = locEl.innerText;
    }

    // 3. Generic OpenGraph & Meta fallbacks
    if (!result.role) {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) result.role = ogTitle;
    }

    if (!result.company) {
      const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
      if (ogSiteName) result.company = ogSiteName;
    }

    // 4. Page Title parsing fallback
    if (!result.role || !result.company) {
      const parsedTitle = parseDocumentTitle(document.title);
      if (!result.role && parsedTitle.role) result.role = parsedTitle.role;
      if (!result.company && parsedTitle.company) result.company = parsedTitle.company;
    }

    // 5. Fallback first H1 for Role
    if (!result.role) {
      const firstH1 = document.querySelector('h1');
      if (firstH1 && firstH1.innerText.length < 90) {
        result.role = firstH1.innerText;
      }
    }

  } catch (err) {
    console.warn('[K-Apply] Metadata extraction error:', err);
  }

  return cleanJobDetails(result);
}

function parseDocumentTitle(rawTitle) {
  if (!rawTitle) return { role: '', company: '' };
  
  // Typical formats:
  // "Senior Frontend Developer at Stripe"
  // "Stripe - Software Engineer"
  // "Software Engineer | Netflix Jobs"
  const title = rawTitle.replace(/\s+/g, ' ').trim();

  // Pattern: "... at [Company]"
  const atMatch = title.match(/^(.+?)\s+at\s+([^-|–—]+)/i);
  if (atMatch) {
    return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  }

  // Pattern: "[Company] - [Role]" or "[Role] - [Company]"
  const delimiterMatch = title.split(/\s*[-–—|•]\s*/);
  if (delimiterMatch.length >= 2) {
    const p1 = delimiterMatch[0].trim();
    const p2 = delimiterMatch[1].trim();
    // Guess: shorter is usually company, or contains 'job/career'
    if (/career|job|apply|hire/i.test(p2)) {
      return { role: p1, company: '' };
    }
    return { role: p1, company: p2 };
  }

  return { role: title, company: '' };
}

function cleanJobDetails(details) {
  return {
    company: sanitize(details.company),
    role: sanitize(details.role),
    location: sanitize(details.location),
    url: details.url || window.location.href,
    source: details.source || 'web'
  };
}

function sanitize(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').replace(/\n|\r/g, '').trim();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
