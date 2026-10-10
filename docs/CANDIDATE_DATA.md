# 👤 Candidate Master Profile, Resume & Knowledge Vault

This document describes the candidate profile schema, the structured Q&A
response vault, resume variants, and template interpolation dictionaries used
across **K-Apply** (Chrome Extension, Web Dashboard, and Autonomous Hunter).

> **This repository ships no user data.** All fields below are blank templates.
> Fill in your own values through the extension dashboard or the Command Center
> **Database & Sync** view before autofilling applications.

---

## 1. Candidate Master Profile

```yaml
# Personal Information
first_name: ""
last_name: ""
full_name: ""
headline: ""
email: ""
phone: ""

# Location & Address
location:
  city: ""
  state: ""
  country: ""
  postal_code: ""
  address_line: ""

# Professional Experience & Terms
current_role: ""
current_company: ""
years_of_experience: 0
notice_period: ""
notice_period_weeks: 0
employment_type_preferred: ""
target_roles:
  - ""
desired_salary: ""

# Online Footprint & Portfolio
links:
  linkedin: ""
  github: ""
  portfolio: ""
  website: ""
  twitter: ""

# Education & Academic Background
education:
  highest_degree: ""
  degree: ""
  university: ""
  graduation_year: 0
  gpa: ""

# Work Authorization & Equal Opportunity (EEOC)
work_authorization:
  authorized_to_work: null
  requires_sponsorship: null
  future_sponsorship_needed: null
eeoc_demographics:
  gender: ""
  race_ethnicity: ""
  veteran_status: ""
  disability_status: ""
```

---

## 2. Complete Q&A Knowledge Vault

Screening questions are indexed with unique IDs, categories, and keyword
triggers for the scoring engine. Each `answer` starts blank — populate it with
your own authentic response.

### Q1: About Myself (100 - 200 words)
* **ID:** `qa-about-myself`
* **Category:** `About & Summary`
* **Trigger Keywords:** `about myself`, `about you`, `bio`, `summary`, `introduce yourself`, `tell me about yourself`, `professional summary`, `overview`, `background`
* **Answer Content:**
```text
```

---

### Q2: Cover Letter Template
* **ID:** `qa-cover-letter`
* **Category:** `Cover Letter`
* **Trigger Keywords:** `cover letter`, `coverletter`, `letter`, `personal note`, `statement of interest`, `additional information`, `pitch`, `message to hiring manager`
* **Dynamic Variables Supported:** `{{company_name}}`, `{{role}}`, `{{full_name}}`
* **Answer Content:**
```text
```

---

### Q3: Cold Email Outreach Template
* **ID:** `qa-cold-email`
* **Category:** `Outreach & Networking`
* **Trigger Keywords:** `cold email`, `email template`, `networking email`, `outreach`, `recruiter email`
* **Dynamic Variables Supported:** `{{recruiter_name}}`, `{{role}}`, `{{company_name}}`, `{{portfolio_url}}`, `{{job_url}}`, `{{full_name}}`
* **Answer Content:**
```text
Hi {{recruiter_name}},

I noticed an open {{role}} at {{company_name}}. I'd love to be considered.

You can find my resume and portfolio at {{portfolio_url}}, and I applied via your careers portal: {{job_url}}.

Thanks,
{{full_name}}
```

---

### Q4: What Makes Me Exceptional
* **ID:** `qa-strengths`
* **Category:** `Strengths & Impact`
* **Trigger Keywords:** `what makes you exceptional`, `exceptional`, `superpower`, `unique strengths`, `what sets you apart`, `why should we hire you`, `differentiator`, `greatest strength`
* **Answer Content:**
```text
```

---

### Q5: Proudest Project or Startup Experience
* **ID:** `qa-proud-project`
* **Category:** `Projects & Achievements`
* **Trigger Keywords:** `proud of`, `project you built`, `favorite project`, `achievement`, `key project`, `most proud`, `impressive project`
* **Answer Content:**
```text
```

---

### Q6: Culture & Motivation
* **ID:** `qa-motivation`
* **Category:** `Culture & Motivation`
* **Trigger Keywords:** `what motivates you`, `motivation`, `thrive`, `environment`, `work culture`, `how do you handle pressure`, `high-pressure`, `drive`
* **Answer Content:**
```text
```

---

### Q7: Reason for Career Change
* **ID:** `qa-reason-for-change`
* **Category:** `Career & Transition`
* **Trigger Keywords:** `reason for change`, `why are you looking`, `why leave`, `looking for a change`, `next role`, `career goals`, `reason for leaving`, `why change`
* **Answer Content:**
```text
```

---

### Q8: Production Incidents & Resolution Playbooks
* **ID:** `qa-prod-incident-fix`
* **Category:** `Problem Solving`
* **Trigger Keywords:** `production issue`, `faced an issue`, `fixed on production`, `bug in production`, `challenging bug`, `troubleshooting`, `outage`, `critical fix`, `incident`
* **Answer Content (Problem / Changes / Tradeoffs / Learning):**
```text
```

---

### Q9: LLM / AI Project Integration
* **ID:** `qa-llm-ai-project`
* **Category:** `AI & Innovation`
* **Trigger Keywords:** `claude ai`, `llm`, `large language model`, `openai`, `ai project`, `ai integration`, `rag`, `ai in react and node`, `speech to text`, `voice search`
* **Answer Content:**
```text
```

---

### Q10: Additional Notes for Interviewers
* **ID:** `qa-ai-motivation-notice`
* **Category:** `AI & Innovation`
* **Trigger Keywords:** `interest in ai`, `notice period`, `availability`, `start date`, `how soon can you start`
* **Answer Content:**
```text
```

---

## 3. Candidate Resume Profiles

Provide a resume as a Markdown, PDF, or DOCX file to the Hunter engine. See
[`JobHunter/data/sample_resume.md`](../JobHunter/data/sample_resume.md) for the
expected fictional sample format.

```markdown
# Your Name
**Your Headline**
City, Country | email@example.com | +1 (555) 000-0000
LinkedIn: linkedin.com/in/your-handle | GitHub: github.com/your-handle | Portfolio: example.com

---

### Professional Summary
```

---

## 4. Template Interpolation Variables

These tokens are resolved dynamically at autofill time from the current page and
your profile:

| Token | Description |
| :--- | :--- |
| `{{company_name}}` | Hiring company |
| `{{role}}` | Job title |
| `{{recruiter_name}}` | Recruiter / hiring manager |
| `{{full_name}}` | Your full name |
| `{{portfolio_url}}` | Your portfolio link |
| `{{job_url}}` | URL of the job posting |
