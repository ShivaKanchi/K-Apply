# 📊 K-Apply Command Center & REST API Specifications

This document outlines the full-stack architecture, route organization, and REST API specification for the **K-Apply Web Application & Command Center** ([`web-dashboard/`](../web-dashboard)).

---

## 1. Application Routing & Architecture

The application is built on **Next.js (App Router)** with Tailwind CSS and shadcn/ui components:

```
web-dashboard/
├── app/
│   ├── layout.jsx            # Global HTML shell, fonts & metadata
│   ├── globals.css           # Modern SaaS design system & theme tokens
│   ├── page.jsx              # K-Apply SaaS Product Landing Page (/)
│   ├── dashboard/
│   │   └── page.jsx          # Interactive Command Center Workspace (/dashboard)
│   └── api/                  # RESTful API Endpoints
│       ├── hunter/           # Python Autonomous Worker IPC Bridge
│       ├── discovery/        # Direct Multi-ATS Web Scraping & Scoring
│       ├── ai/               # Local Ollama Llama 3.1 LLM Studio
│       │   ├── cover-letter/ # Tailored Cover Letter Generator
│       │   ├── answer/       # Custom Screening Question Answerer
│       │   └── models/       # Available Local LLM Introspection
│       ├── applications/     # Job Tracker Pipeline (Kanban & Table)
│       ├── qa/               # Knowledge Vault CRUD
│       ├── profile/          # Candidate Master Profile CRUD
│       ├── seed/             # 1-Click MongoDB Seeder
│       └── health/           # System Connectivity & Database Health
```

---

## 2. Comprehensive REST API Reference

All endpoints support cross-origin resource sharing (CORS) with pre-flight `OPTIONS` handling so the Chrome Extension, external tools, or background scripts can interact directly.

### A. Hunter Autonomous Worker Bridge (`/api/hunter`)

| Method | Endpoint      | Description                                                                     |
| :----- | :------------ | :------------------------------------------------------------------------------ |
| `GET`  | `/api/hunter` | Returns worker status, Python 3.11 environment, and directory path.             |
| `POST` | `/api/hunter` | Executes autonomous job discovery, question intelligence, or Playwright worker. |

#### Request Payload (`POST /api/hunter`):

```json
{
  "action": "hunt | intel | playwright",
  "company": "stripe",
  "role": "Full Stack Engineer",
  "portal": "auto | greenhouse | lever | ashby | workday",
  "mode": "review | auto",
  "url": "https://boards.greenhouse.io/stripe/jobs/5910244"
}
```

- **`action: "hunt"`**: Runs multi-ATS board scraping and candidate matching, returning ranked jobs and the complete intelligence pack.
- **`action: "intel"`**: Pre-computes company culture, screening answers, and top 8 interview questions.
- **`action: "playwright"`**: Spawns desktop Chromium on the user's computer via `child_process.spawn(..., { detached: true })` in HITL review mode.

---

### B. Direct ATS Discovery Engine (`/api/discovery`)

| Method | Endpoint         | Description                                                             |
| :----- | :--------------- | :---------------------------------------------------------------------- |
| `POST` | `/api/discovery` | Direct queries to Greenhouse, Lever, and Ashby APIs with skill scoring. |

#### Request Payload:

```json
{
  "company": "figma",
  "portal": "auto",
  "role": "Senior Frontend"
}
```

#### Response:

```json
{
  "success": true,
  "portalFound": "greenhouse",
  "count": 18,
  "jobs": [
    {
      "id": "gh_4920194",
      "title": "Software Engineer, Design Systems",
      "company": "Figma",
      "portal": "greenhouse",
      "location": "San Francisco, CA / Remote",
      "apply_url": "https://boards.greenhouse.io/figma/jobs/4920194",
      "matchScore": 94,
      "matchedSkills": ["React", "TypeScript", "Design Systems", "CSS"]
    }
  ]
}
```

---

### C. AI Pitch Studio (`/api/ai/*`)

The pitch studio interfaces with local **Ollama** instances (`http://localhost:11434`) running `llama3.1`, with zero cloud data leakage.

#### 1. Generate Bespoke Cover Letter (`POST /api/ai/cover-letter`)

```json
{
  "company": "Stripe",
  "role": "Senior Infrastructure Engineer",
  "jobDescription": "Looking for distributed systems expertise...",
  "instructions": "Tone: Executive & Senior Engineer | Highlight production incident fix",
  "model": "llama3.1"
}
```

#### 2. Answer Custom Screening Prompt (`POST /api/ai/answer`)

```json
{
  "company": "Vercel",
  "role": "AI Solutions Engineer",
  "question": "What is the most complex agentic system you have built?",
  "instructions": "Focus on MCP and Claude integrations"
}
```

#### 3. List Local Models (`GET /api/ai/models`)

Queries `http://localhost:11434/api/tags` and returns installed models (`llama3.1`, `mistral`, `deepseek-r1`, etc.).

---

### D. Application Pipeline CRUD (`/api/applications`)

Manages the Kanban & Table tracking database:

- **`GET /api/applications`**: Returns all tracked applications sorted by `updatedAt` descending.
- **`POST /api/applications`**: Logs a new job application.
  ```json
  {
    "company": "Stripe",
    "role": "Full Stack Engineer",
    "location": "Remote",
    "url": "https://boards.greenhouse.io/stripe/jobs/123",
    "status": "applied | wishlist | interviewing | offer | rejected",
    "salary": "$150,000 - $180,000",
    "notes": "Applied via K-Apply 1-click autofill."
  }
  ```
- **`PATCH /api/applications/[id]`**: Updates status, stage, or notes.
- **`DELETE /api/applications/[id]`**: Deletes application record.

---

### E. Q&A Knowledge Vault (`/api/qa`)

- **`GET /api/qa`**: Retrieves all pre-loaded and custom questions and answers.
- **`POST /api/qa`**: Adds a new question, answer, and trigger keywords.
- **`PATCH /api/qa/[id]`**: Edits an existing Q&A item.
- **`DELETE /api/qa/[id]`**: Removes a Q&A item.

---

### F. Candidate Profile & 1-Click Seeding

- **`GET & POST /api/profile`**: Reads or updates candidate contact info, personal links, skills array, and notice period.
- **`POST /api/seed`**: Seeds the MongoDB database with the blank Q&A templates, empty candidate profile, and no applications from `web-dashboard/data/seed-data.js`. Accepts `{ force: true }` to reset collections.

---

## 3. Database Architecture & Serverless Connection Pooling

### Connection Caching (`lib/mongodb.js`)

Next.js in development mode creates multiple Node processes during Hot Module Replacement (HMR). Without connection caching, each file save opens a new connection, quickly exceeding connection limits on MongoDB Atlas.

```javascript
import { MongoClient } from "mongodb";

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

### Transparent In-Memory Fallback (`lib/db-operations.js`)

If `MONGODB_URI` is missing from `.env.local` or the database is temporarily offline:

1. `getDb()` catches the connection failure.
2. The operation automatically switches to an in-memory dictionary store (`global.__inMemoryDb`).
3. The dashboard status indicator displays **🟡 In-Memory Mode (Demo)** instead of crashing with HTTP 500 errors.
