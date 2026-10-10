/**
 * Default Profile and Q&A Templates for K-Apply
 *
 * These are intentionally blank templates. No user data ships with the
 * extension. Populate your own profile and answers through the in-extension
 * dashboard or the Command Center (Dashboard & Sync) before autofilling.
 */

export const DEFAULT_PROFILE = {
  // Basic Information
  firstName: "",
  lastName: "",
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",

  // Professional Details
  headline: "",
  currentRole: "",
  currentCompany: "",
  yearsOfExperience: "",
  noticePeriod: "",
  currentSalary: "",
  expectedSalary: "",

  // Links
  linkedin: "",
  github: "",
  portfolio: "",
  website: "",
  twitter: "",

  // Education
  highestDegree: "",
  degree: "",
  university: "",
  graduationYear: "",
  gpa: "",

  // Work Authorization & Equal Opportunity
  authorizedToWork: "",
  requiresSponsorship: "",
  gender: "",
  race: "",
  veteranStatus: "",
  disabilityStatus: ""
};

export const DEFAULT_QA = [
  {
    id: "qa-about-myself",
    title: "About myself",
    category: "About & Summary",
    keywords: [
      "about myself", "about you", "bio", "summary", "introduce yourself",
      "tell me about yourself", "professional summary", "overview", "background"
    ],
    answer: ""
  },
  {
    id: "qa-cover-letter",
    title: "Cover Letter Template",
    category: "Cover Letter",
    keywords: [
      "cover letter", "coverletter", "letter", "personal note",
      "statement of interest", "additional information", "pitch", "message to hiring manager"
    ],
    answer: ""
  },
  {
    id: "qa-strengths",
    title: "What makes me exceptional",
    category: "Strengths & Impact",
    keywords: [
      "what makes you exceptional", "exceptional", "superpower", "unique strengths",
      "what sets you apart", "why should we hire you", "differentiator", "greatest strength"
    ],
    answer: ""
  },
  {
    id: "qa-proud-project",
    title: "A project I'm proud of",
    category: "Projects & Achievements",
    keywords: [
      "proud of", "project you built", "favorite project", "achievement",
      "key project", "most proud", "impressive project"
    ],
    answer: ""
  },
  {
    id: "qa-motivation",
    title: "What motivates you?",
    category: "Culture & Motivation",
    keywords: [
      "what motivates you", "motivation", "thrive", "environment", "work culture",
      "how do you handle pressure", "high-pressure", "drive"
    ],
    answer: ""
  },
  {
    id: "qa-reason-for-change",
    title: "Reason for change",
    category: "Career & Transition",
    keywords: [
      "reason for change", "why are you looking", "why leave", "looking for a change",
      "next role", "career goals", "reason for leaving", "why change"
    ],
    answer: ""
  },
  {
    id: "qa-prod-incident-fix",
    title: "Production issue faced and fixed",
    category: "Problem Solving",
    keywords: [
      "production issue", "faced an issue", "fixed on production", "bug in production",
      "challenging bug", "troubleshooting", "outage", "critical fix", "incident"
    ],
    answer: ""
  },
  {
    id: "qa-cold-email",
    title: "Cold Email Outreach Template",
    category: "Outreach & Networking",
    keywords: [
      "cold email", "email template", "networking email", "outreach", "recruiter email"
    ],
    answer: `Hi {{recruiter_name}},

I noticed an open {{role}} at {{company_name}}. I'd love to be considered.

You can find my resume and portfolio at {{portfolio_url}}, and I applied via your careers portal: {{job_url}}.

Thanks,
{{full_name}}`
  }
];

export const APPLICATION_STATUSES = [
  { id: "applied", label: "Applied", color: "#3b82f6", bg: "#eff6ff" },
  { id: "wishlist", label: "Wishlist / Saved", color: "#6b7280", bg: "#f3f4f6" },
  { id: "interviewing", label: "Interviewing", color: "#f59e0b", bg: "#fef3c7" },
  { id: "offer", label: "Offer Received", color: "#10b981", bg: "#d1fae5" },
  { id: "rejected", label: "Rejected", color: "#ef4444", bg: "#fee2e2" }
];
