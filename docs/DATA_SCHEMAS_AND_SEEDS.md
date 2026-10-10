# 🗄️ K-Apply Data Schemas, Seed Records & Models

This document defines the data models, database schemas, and seed datasets
utilized across **K-Apply** (Next.js Command Center, Chrome Extension storage,
and JobHunter SQLite).

> **No user data ships with this repository.** Every record below is a blank
> template. Populate your own data through the extension dashboard or the
> Command Center **Database & Sync** view.

---

## 1. MongoDB Collections & Schemas (`web-dashboard`)

### A. Collection: `profile`
Stores the candidate's canonical resume data, contact info, professional
highlights, and default EEOC answers.

```json
{
  "_id": "ObjectId('66f5a1b2c3d4e5f6a7b8c9d0')",
  "firstName": "",
  "lastName": "",
  "fullName": "",
  "headline": "",
  "email": "",
  "phone": "",
  "address": "",
  "city": "",
  "state": "",
  "country": "",
  "postalCode": "",
  "currentRole": "",
  "currentCompany": "",
  "yearsOfExperience": "",
  "noticePeriod": "",
  "currentSalary": "",
  "expectedSalary": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "website": "",
  "twitter": "",
  "highestDegree": "",
  "degree": "",
  "university": "",
  "graduationYear": "",
  "gpa": "",
  "authorizedToWork": "",
  "requiresSponsorship": "",
  "gender": "",
  "race": "",
  "veteranStatus": "",
  "disabilityStatus": ""
}
```

---

### B. Collection: `qa` (Knowledge Vault)
Screening questions, behavioral answers, dynamic cover letters, and incident
playbooks. Each `answer` starts blank.

```json
[
  {
    "id": "qa-about-myself",
    "title": "About myself",
    "category": "About & Summary",
    "keywords": ["about myself", "about you", "bio", "summary", "introduce yourself", "tell me about yourself", "professional summary", "overview", "background"],
    "answer": ""
  },
  {
    "id": "qa-cover-letter",
    "title": "Cover Letter Template",
    "category": "Cover Letter",
    "keywords": ["cover letter", "coverletter", "letter", "personal note", "statement of interest", "additional information", "pitch", "message to hiring manager"],
    "answer": ""
  },
  {
    "id": "qa-strengths",
    "title": "What makes me exceptional",
    "category": "Strengths & Impact",
    "keywords": ["what makes you exceptional", "exceptional", "superpower", "unique strengths", "what sets you apart", "why should we hire you", "differentiator", "greatest strength"],
    "answer": ""
  },
  {
    "id": "qa-proud-project",
    "title": "A project I'm proud of",
    "category": "Projects & Achievements",
    "keywords": ["proud of", "project you built", "favorite project", "achievement", "key project", "most proud", "impressive project"],
    "answer": ""
  },
  {
    "id": "qa-motivation",
    "title": "What motivates you?",
    "category": "Culture & Motivation",
    "keywords": ["what motivates you", "motivation", "thrive", "environment", "work culture", "how do you handle pressure", "high-pressure", "drive"],
    "answer": ""
  },
  {
    "id": "qa-reason-for-change",
    "title": "Reason for change",
    "category": "Career & Transition",
    "keywords": ["reason for change", "why are you looking", "why leave", "looking for a change", "next role", "career goals", "reason for leaving", "why change"],
    "answer": ""
  },
  {
    "id": "qa-prod-incident-fix",
    "title": "Production issue faced and fixed",
    "category": "Problem Solving",
    "keywords": ["production issue", "faced an issue", "fixed on production", "bug in production", "challenging bug", "troubleshooting", "outage", "critical fix", "incident"],
    "answer": ""
  },
  {
    "id": "qa-cold-email",
    "title": "Cold Email Outreach Template",
    "category": "Outreach & Networking",
    "keywords": ["cold email", "email template", "networking email", "outreach", "recruiter email"],
    "answer": "Hi {{recruiter_name}},\n\nI noticed an open {{role}} at {{company_name}}. I'd love to be considered.\n\nYou can find my resume and portfolio at {{portfolio_url}}, and I applied via your careers portal: {{job_url}}.\n\nThanks,\n{{full_name}}"
  }
]
```

---

### C. Collection: `applications`
Application tracking records synced from the Chrome extension or submitted
through the dashboard. Empty by default.

```json
[]
```

---

## 2. SQLite Database Schema (`JobHunter/data/job_hunter.db`)

Managed by Python's `JobTrackerDB` class (`JobHunter/core/tracker/db.py`).
The database file is created at runtime and is gitignored.

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    portal TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    apply_url TEXT NOT NULL,
    match_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'discovered', -- 'discovered', 'ready_to_apply', 'applied', 'skipped'
    notes TEXT,
    discovered_at TIMESTAMP,
    applied_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(match_score);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
```

---

## 3. Chrome Extension Storage Schema (`chrome.storage.local`)

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `kapply_profile` | `Object` | Active candidate profile object (firstName, headline, skills, email, phone, etc.). Blank until you populate it. |
| `kapply_qa_list` | `Array<Object>` | Array of Q&A objects with `keywords`, `category`, and `answer`. |
| `kapply_applications` | `Array<Object>` | Tracked job applications saved from ATS pages or the popup. |
| `kapply_settings` | `Object` | `{ enableFloatingButton: true, autoHighlightFields: true, apiUrl: "http://localhost:3000" }`. |
