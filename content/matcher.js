/**
 * Intelligent Form Field Matcher
 * Maps web page form inputs to User Profile fields and Custom Q&A answers
 */

// Field dictionaries for profile matching
export const PROFILE_PATTERNS = {
  firstName: {
    keys: ['first name', 'firstname', 'given-name', 'fname', 'first_name', 'first'],
    autocomplete: ['given-name']
  },
  lastName: {
    keys: ['last name', 'lastname', 'family-name', 'lname', 'last_name', 'surname'],
    autocomplete: ['family-name']
  },
  fullName: {
    keys: ['full name', 'fullname', 'your name', 'candidate name', 'applicant name', 'name'],
    autocomplete: ['name']
  },
  email: {
    keys: ['email', 'email address', 'e-mail', 'contact email', 'emailaddress'],
    autocomplete: ['email'],
    type: 'email'
  },
  phone: {
    keys: ['phone', 'phone number', 'mobile', 'cell', 'telephone', 'contact number', 'phone_number'],
    autocomplete: ['tel'],
    type: 'tel'
  },
  linkedin: {
    keys: ['linkedin', 'linkedin profile', 'linkedin url', 'linked in'],
    urlMatch: 'linkedin.com'
  },
  github: {
    keys: ['github', 'github profile', 'github url', 'git profile'],
    urlMatch: 'github.com'
  },
  portfolio: {
    keys: ['portfolio', 'portfolio url', 'personal website', 'website', 'personal site', 'online portfolio', 'link to your work', 'blog'],
    autocomplete: ['url']
  },
  city: {
    keys: ['city', 'current city', 'town'],
    autocomplete: ['address-level2']
  },
  state: {
    keys: ['state', 'province', 'region'],
    autocomplete: ['address-level1']
  },
  country: {
    keys: ['country', 'residence country', 'nationality'],
    autocomplete: ['country', 'country-name']
  },
  postalCode: {
    keys: ['postal code', 'zip', 'zipcode', 'pincode', 'postal'],
    autocomplete: ['postal-code']
  },
  address: {
    keys: ['address', 'street address', 'location', 'current address', 'where do you live'],
    autocomplete: ['street-address']
  },
  currentCompany: {
    keys: ['current company', 'current employer', 'present company', 'company you work for', 'employer']
  },
  currentRole: {
    keys: ['current title', 'current role', 'current job title', 'job title', 'current position', 'headline']
  },
  yearsOfExperience: {
    keys: ['years of experience', 'total experience', 'yoe', 'how many years of experience', 'years of relevant experience']
  },
  noticePeriod: {
    keys: ['notice period', 'availability to start', 'how soon can you start', 'earliest start date', 'joining time', 'days of notice']
  },
  currentSalary: {
    keys: ['current salary', 'current ctc', 'current compensation']
  },
  expectedSalary: {
    keys: ['expected salary', 'expected ctc', 'salary expectation', 'compensation expectations', 'desired salary']
  },
  degree: {
    keys: ['degree', 'highest degree', 'highest level of education', 'qualification', 'major']
  },
  university: {
    keys: ['university', 'college', 'school', 'institution', 'educational institution']
  },
  graduationYear: {
    keys: ['graduation year', 'year of graduation', 'completion year']
  },
  gpa: {
    keys: ['gpa', 'grades', 'grade', 'percentage', 'marks']
  },
  authorizedToWork: {
    keys: ['authorized to work', 'legally authorized', 'work authorization', 'eligible to work in']
  },
  requiresSponsorship: {
    keys: ['require sponsorship', 'need sponsorship', 'visa sponsorship', 'will you now or in the future require']
  },
  gender: {
    keys: ['gender', 'gender identity']
  },
  race: {
    keys: ['race', 'ethnicity', 'ethnic origin']
  },
  veteranStatus: {
    keys: ['veteran status', 'are you a veteran']
  },
  disabilityStatus: {
    keys: ['disability', 'disability status']
  }
};

/**
 * Extracts combined text cues for an input element (label, placeholder, name, id, etc.)
 */
export function extractElementCues(el) {
  const cues = [];

  // 1. Direct label association via id
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) cues.push(label.innerText);
  }

  // 2. Parent or closest label
  const parentLabel = el.closest('label');
  if (parentLabel) {
    cues.push(parentLabel.innerText);
  }

  // 3. Closest field container label/header (common in ATS frameworks)
  const container = el.closest('.field, .form-group, .application-field, [data-automation-id], .jobs-easy-apply-form-section__grouping');
  if (container) {
    const heading = container.querySelector('label, h3, h4, .label, .field-label, legend, span');
    if (heading && heading !== el) {
      cues.push(heading.innerText);
    }
  }

  // 4. aria attributes
  if (el.getAttribute('aria-label')) cues.push(el.getAttribute('aria-label'));
  if (el.getAttribute('aria-labelledby')) {
    const labelledEl = document.getElementById(el.getAttribute('aria-labelledby'));
    if (labelledEl) cues.push(labelledEl.innerText);
  }

  // 5. Native attributes
  if (el.placeholder) cues.push(el.placeholder);
  if (el.name) cues.push(el.name.replace(/[-_]/g, ' '));
  if (el.id) cues.push(el.id.replace(/[-_]/g, ' '));
  if (el.getAttribute('autocomplete')) cues.push(el.getAttribute('autocomplete'));

  // 6. Preceding sibling / paragraph text if empty
  if (cues.length === 0 && el.previousElementSibling) {
    cues.push(el.previousElementSibling.innerText);
  }

  return cleanCuesText(cues.join(' '));
}

function cleanCuesText(text) {
  return text
    .toLowerCase()
    .replace(/[*\:\?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches an element against Profile fields and Q&A items
 * Returns { type: 'profile' | 'qa', key, value, score, title } or null
 */
export function matchElement(element, profile, qaList, jobContext = {}) {
  // Ignore hidden, disabled, submit, buttons, passwords
  if (
    element.disabled ||
    element.readOnly ||
    element.type === 'hidden' ||
    element.type === 'submit' ||
    element.type === 'password' ||
    element.type === 'button'
  ) {
    return null;
  }

  const cues = extractElementCues(element);
  if (!cues) return null;

  const isTextarea = element.tagName === 'TEXTAREA' || element.isContentEditable;
  const isInput = element.tagName === 'INPUT';
  const inputType = (element.type || '').toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  // --- Step 1: Check Profile Fields First for standard inputs ---
  if (!isTextarea || cues.includes('summary') || cues.includes('about') || cues.includes('cover letter')) {
    for (const [fieldKey, pattern] of Object.entries(PROFILE_PATTERNS)) {
      const val = profile[fieldKey];
      if (!val) continue;

      let score = 0;

      // Autocomplete exact match
      const ac = (element.getAttribute('autocomplete') || '').toLowerCase();
      if (pattern.autocomplete && pattern.autocomplete.includes(ac)) {
        score += 80;
      }

      // Input type match
      if (pattern.type && inputType === pattern.type) {
        score += 30;
      }

      // Key matching
      for (const key of pattern.keys) {
        // Special case for single-word "name": don't match if cues have "first" or "last"
        if (fieldKey === 'fullName' && (cues.includes('first') || cues.includes('last'))) {
          continue;
        }
        if (fieldKey === 'firstName' && cues.includes('last')) {
          continue;
        }

        const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'i');
        if (regex.test(cues)) {
          score += 45;
          break;
        } else if (cues.includes(key)) {
          score += 25;
          break;
        }
      }

      if (score > highestScore && score >= 25) {
        highestScore = score;
        bestMatch = {
          type: 'profile',
          key: fieldKey,
          value: val,
          score,
          title: `Profile: ${fieldKey}`
        };
      }
    }
  }

  // --- Step 2: Check Q&A Database (Crucial for Textareas, Large Inputs & Questions) ---
  for (const qa of qaList) {
    if (!qa.answer) continue;

    let score = 0;
    const lowerTitle = (qa.title || '').toLowerCase();

    // Direct title phrase match
    if (cues.includes(lowerTitle)) {
      score += 60;
    }

    // Keyword matching
    if (Array.isArray(qa.keywords)) {
      for (const kw of qa.keywords) {
        const cleanKw = kw.toLowerCase().trim();
        if (!cleanKw) continue;
        const regex = new RegExp(`\\b${escapeRegExp(cleanKw)}\\b`, 'i');
        if (regex.test(cues)) {
          score += 40;
        } else if (cues.includes(cleanKw)) {
          score += 20;
        }
      }
    }

    // Heavy boost for textareas matching long-form answers
    if (isTextarea && score > 0) {
      score += 25;
    }

    // Specific category boosts
    if (isTextarea && qa.id === 'qa-cover-letter' && (cues.includes('cover') || cues.includes('letter') || cues.includes('note to hiring'))) {
      score += 50;
    }

    if (score > highestScore && score >= 35) {
      // Interpolate dynamic template variables
      const processedAnswer = interpolateVariables(qa.answer, profile, jobContext);

      highestScore = score;
      bestMatch = {
        type: 'qa',
        key: qa.id,
        value: processedAnswer,
        score,
        title: qa.title
      };
    }
  }

  return bestMatch;
}

/**
 * Replaces variables like {{company_name}}, {{role}}, {{full_name}}, etc. in answers
 */
export function interpolateVariables(template, profile = {}, jobContext = {}) {
  if (!template) return '';

  return template
    .replace(/\{\{\s*company_name\s*\}\}|\{\{\s*Company\s*\}\}|\{\{\s*company\s*\}\}/gi, jobContext.company || 'your team')
    .replace(/\{\{\s*role\s*\}\}|\{\{\s*Role\s*\}\}|\{\{\s*Job Title\s*\}\}/gi, jobContext.role || 'this position')
    .replace(/\{\{\s*Recruiter's Name\s*\}\}|\{\{\s*recruiter_name\s*\}\}/gi, 'Hiring Team')
    .replace(/\{\{\s*Your Name\s*\}\}|\{\{\s*full_name\s*\}\}/gi, profile.fullName || profile.firstName || 'Candidate')
    .replace(/\{\{\s*Years of Experience\s*\}\}/gi, `${profile.yearsOfExperience || '2+'} years`)
    .replace(/\{\{\s*Key Skills\s*\}\}/gi, 'React.js, Next.js, TypeScript, and modern frontend/backend architectures')
    .replace(/\{\{\s*Portfolio \/ LinkedIn\s*\}\}/gi, profile.portfolio || profile.linkedin || '')
    .replace(/\{\{\s*portfolio_url\s*\}\}/gi, profile.portfolio || '')
    .replace(/\{\{\s*Hyperlinked Job Link\s*\}\}|\{\{\s*job_url\s*\}\}/gi, jobContext.url || (typeof window !== 'undefined' && window.location ? window.location.href : ''));
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts a clean, human-readable label or title for any form element
 */
export function getFieldLabel(el) {
  if (!el) return 'Form Field';

  // 1. Direct label via for="id"
  if (el.id && typeof document !== 'undefined') {
    try {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label && label.innerText?.trim()) {
        return cleanLabelText(label.innerText);
      }
    } catch (e) {}
  }

  // 2. Parent label
  const parentLabel = el.closest ? el.closest('label') : null;
  if (parentLabel && parentLabel.innerText?.trim()) {
    const text = parentLabel.innerText.replace(el.value || '', '').trim();
    if (text) return cleanLabelText(text);
  }

  // 3. Closest container label/heading
  if (el.closest) {
    const container = el.closest('.field, .form-group, .form-item, .application-field, [data-automation-id], .jobs-easy-apply-form-section__grouping');
    if (container) {
      const heading = container.querySelector('label, h3, h4, .label, .field-label, legend, span');
      if (heading && heading !== el && heading.innerText?.trim()) {
        return cleanLabelText(heading.innerText);
      }
    }
  }

  // 4. aria-label or aria-labelledby
  const ariaLabel = el.getAttribute ? el.getAttribute('aria-label') : null;
  if (ariaLabel && ariaLabel.trim()) return cleanLabelText(ariaLabel);

  const ariaId = el.getAttribute ? el.getAttribute('aria-labelledby') : null;
  if (ariaId && typeof document !== 'undefined') {
    const labelled = document.getElementById(ariaId);
    if (labelled && labelled.innerText?.trim()) return cleanLabelText(labelled.innerText);
  }

  // 5. Placeholder
  if (el.placeholder && el.placeholder.trim()) {
    return cleanLabelText(el.placeholder);
  }

  // 6. Name attribute
  if (el.name && el.name.trim()) {
    return formatAttributeName(el.name);
  }

  // 7. ID attribute
  if (el.id && el.id.trim()) {
    return formatAttributeName(el.id);
  }

  const tag = (el.tagName || 'Input').toLowerCase();
  const type = el.type ? ` (${el.type})` : '';
  return `Field ${tag}${type}`;
}

function cleanLabelText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[*:\?]/g, '')
    .trim()
    .slice(0, 60);
}

function formatAttributeName(name) {
  return name
    .replace(/[_\-\[\]\.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    .slice(0, 60);
}

