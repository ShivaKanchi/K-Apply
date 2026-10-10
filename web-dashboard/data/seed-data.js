/**
 * Seed data templates for K-Apply Command Center.
 *
 * Intentionally blank. No user data ships with this repository. Populate your
 * own profile, answers, and applications via the dashboard (Database & Sync).
 */

export const INITIAL_PROFILE = {
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

  headline: "",
  currentRole: "",
  currentCompany: "",
  yearsOfExperience: "",
  noticePeriod: "",
  currentSalary: "",
  expectedSalary: "",

  linkedin: "",
  github: "",
  portfolio: "",
  website: "",
  twitter: "",

  highestDegree: "",
  degree: "",
  university: "",
  graduationYear: "",
  gpa: "",

  authorizedToWork: "",
  requiresSponsorship: "",
  gender: "",
  race: "",
  veteranStatus: "",
  disabilityStatus: ""
};

export const INITIAL_QA = [
  {
    title: "About myself",
    category: "About & Summary",
    keywords: [
      "about myself", "about you", "bio", "summary", "introduce yourself",
      "tell me about yourself", "professional summary", "overview", "background"
    ],
    answer: ""
  },
  {
    title: "Cover Letter Template",
    category: "Cover Letter",
    keywords: [
      "cover letter", "coverletter", "letter", "personal note",
      "statement of interest", "additional information", "pitch", "message to hiring manager"
    ],
    answer: ""
  },
  {
    title: "What makes me exceptional",
    category: "Strengths & Impact",
    keywords: [
      "what makes you exceptional", "exceptional", "superpower", "unique strengths",
      "what sets you apart", "why should we hire you", "differentiator", "greatest strength"
    ],
    answer: ""
  },
  {
    title: "A project I'm proud of",
    category: "Projects & Achievements",
    keywords: [
      "proud of", "project you built", "favorite project", "achievement",
      "key project", "most proud", "impressive project"
    ],
    answer: ""
  },
  {
    title: "What motivates you?",
    category: "Culture & Motivation",
    keywords: [
      "what motivates you", "motivation", "thrive", "environment", "work culture",
      "how do you handle pressure", "high-pressure", "drive"
    ],
    answer: ""
  },
  {
    title: "Reason for change",
    category: "Career & Transition",
    keywords: [
      "reason for change", "why are you looking", "why leave", "looking for a change",
      "next role", "career goals", "reason for leaving", "why change"
    ],
    answer: ""
  },
  {
    title: "Production issue faced and fixed",
    category: "Problem Solving",
    keywords: [
      "production issue", "faced an issue", "fixed on production", "bug in production",
      "challenging bug", "troubleshooting", "outage", "critical fix", "incident"
    ],
    answer: ""
  },
  {
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

export const INITIAL_APPLICATIONS = [];
