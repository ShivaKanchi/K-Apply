# ⚡ K-Apply - Autonomous AI Job Application Suite & Career Engine

<div align="center">

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](manifest.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-000000?logo=nextdotjs&logoColor=white)](web-dashboard/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](web-dashboard/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](web-dashboard/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Components-000000?logo=shadcnui&logoColor=white)](web-dashboard/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](JobHunter/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-2EAD33?logo=playwright&logoColor=white)](JobHunter/)
[![Ollama Local LLM](https://img.shields.io/badge/AI_Engine-Ollama_Llama_3.1-black?logo=ollama&logoColor=white)](https://ollama.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas_%2F_Local-47A248?logo=mongodb&logoColor=white)](web-dashboard/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Apply 10x faster. Automate ATS discovery. Never retype an interview answer again.**

*A privacy-first, local-LLM career acceleration platform combining a React-aware Chrome copilot, an autonomous Python crawler with predictive question intelligence, and a Next.js Kanban command center.*

[Architecture](#-system-architecture) •
[Features](#-key-capabilities) •
[Quickstart](#-quickstart-guide) •
[Supported ATS](#-supported-ats-platforms) •
[Production & Packaging](#-production-deployment--packaging) •
[Documentation](#-documentation-knowledge-base)

</div>

---

## 💡 Why K-Apply?

Modern job seekers face two major pitfalls:
1. **Manual Application Fatigue**: Filling out the same Workday, Greenhouse, or Lever fields hundreds of times wastes dozens of hours every week.
2. **Indiscriminate "Spray-and-Pray" AI Bots**: Generic cloud bots spam hundreds of low-quality applications, trigger ATS spam filters, leak sensitive salary and personal history to third-party servers, and fail silently on modern React/Vue SPAs whose state stores reject naive DOM injection.

**K-Apply** solves this with an integrated, three-tier local architecture:
- 🛡️ **100% Local-First & Zero Telemetry**: Your resumes, salary requirements, and answers stay strictly on your machine. All AI generation can run locally using [Ollama](https://ollama.com) (`llama3.1`).
- ⚡ **React Synthetic Event Dispatcher**: Overrides HTMLInputElement prototype setters and bypasses React's internal `_valueTracker` so form state updates properly without resetting on submit.
- 🎯 **Predictive Question Intelligence**: Scrapes company job boards, computes resume match scores, and pairs open screening questions with your authentic STAR experiences.
- 🤝 **Human-in-the-Loop (HITL) Control**: Keeps you in full command. Verify every form via the in-page slide-out audit drawer or Playwright review mode before submitting.

---

## 🏛️ System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │        ⚡ K-APPLY SUITE ECOSYSTEM            │
                               └──────────────────────┬───────────────────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         │                                            │                                            │
         ▼                                            ▼                                            ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐             ┌──────────────────────────────┐
│  ⚡ 1. Chrome Extension       │            │  🎯 2. Autonomous Hunter     │             │  📊 3. Command Center        │
│     (In-Browser Copilot)     │            │     (Python & Playwright)    │             │     (Next.js SaaS Studio)    │
├──────────────────────────────┤            ├──────────────────────────────┤             ├──────────────────────────────┤
│ • Chrome Manifest V3         │            │ • Multi-ATS Discovery Engine │             │ • Next.js 16 + React 19      │
│ • Tailwind v4 + shadcn/ui    │
│ • Floating Draggable Trigger │            │ • Greenhouse, Lever, Ashby,  │             │ • Kanban Pipeline & Table    │
│ • Slide-Out Field Audit View │            │   Workday, LinkedIn Crawlers │             │ • ATS Radar & Match Analysis │
│ • React `_valueTracker` Patch│            │ • TF-IDF / Heuristic Matcher │             │ • AI Pitch & Cover Studio    │
│ • Multi-Signal Scoring Engine│            │ • Predictive Question Intel  │             │ • Master Profile & QA Vault  │
│ • Dynamic Template Variables │            │ • Playwright HITL Review     │             │ • MongoDB Atlas / Local Pool │
│ • 1-Click Status Logging     │            │ • CLI & FastAPI/Streamlit UI │             │ • Local Ollama LLM Proxy     │
└──────────────┬───────────────┘            └──────────────┬───────────────┘             └──────────────┬───────────────┘
               │                                           │                                            │
               │  REST API Sync                            │  Direct Portal Crawl                       │  Local AI (port 11434)
               └───────────────────────────────────────────┼────────────────────────────────────────────┘
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │    🦙 Ollama Local Engine    │
                                            │       (Llama 3.1 8B)         │
                                            │ Zero Cloud Telemetry / Leak  │
                                            └──────────────────────────────┘
```

---

## ✨ Key Capabilities

### ⚡ Pillar 1: Chrome In-Browser Autofill Extension
- **React Synthetic Event Dispatching**: Standard browser autofills fail on modern SPAs because React monitors inputs through internal property descriptors (`_valueTracker`). K-Apply overrides native prototype setters and triggers synthetic `input`, `change`, and `blur` events so React, Angular, and Vue state synchronizes seamlessly.
- **Multi-Signal Heuristic Matching**: Evaluates `name`, `id`, `placeholder`, `aria-label`, `data-automation-id`, and associated `<label>` text using weighted fuzzy scoring across 40+ standard ATS fields.
- **In-Page Slide-Out Audit Drawer**: Never wonder what got filled. A clean sidebar slides open showing an immediate count of **Filled** vs **Skipped** fields with individual preview values.
- **Dynamic Variable Interpolation**: Replaces placeholders like `{{company}}`, `{{role}}`, and `{{years_experience}}` dynamically on the fly from current tab metadata.
- **1-Click Application Tracking**: Instantly logs the open job into your Command Center database directly from the popup or side drawer.

### 🎯 Pillar 2: K-Apply JobHunter (Autonomous Engine)
- **Multi-ATS Discovery**: Native API and HTML crawlers for Greenhouse, Lever, Ashby, Workday, and LinkedIn.
- **Resume Match Scoring**: Analyzes target job descriptions against your indexed resume skills, computing match percentages, missing keywords, and experience alignments.
- **Predictive Screening Intelligence**: Anticipates standard and company-specific interview questions (behavioral, technical, and compensation) and generates STAR-framework answers matched to your real background.
- **Playwright HITL Review Runner**: Launches a real Chromium browser, loads the portal, fills every field automatically, and pauses for human verification before final submission.
- **Dual User Interfaces**: Execute via a robust CLI (`python cli.py hunt`) or interactive Web UI (FastAPI & Streamlit).

### 📊 Pillar 3: Command Center & SaaS Studio
- **Kanban Application Pipeline**: Drag-and-drop workflow tracking (`Saved` → `Applied` → `Interviewing` → `Offer` → `Rejected`) with full application metadata, contact notes, and direct URL shortcuts.
- **ATS Compatibility Radar**: Live visual audit verifying candidate profile readiness across all major hiring software systems.
- **Local Ollama AI Pitch Studio**: Generate tailored cover letters, recruiter cold outreach messages, and custom screening answers directly in your browser powered by local `llama3.1`.
- **Master Profile & Q&A Vault**: Centralize work histories, compensation bands, portfolio links, and 10+ categorized screening responses with dual technical/management variants.
- **Resilient Data Layer**: Native MongoDB connection pooling with zero-configuration fallback to an in-memory database if MongoDB is offline.

---

## 🌐 Supported ATS Platforms

K-Apply includes tailored heuristics, URL matching, and DOM selector pipelines for:

| ATS Platform | Support Level | Discovery Method | Form Automation Support |
| :--- | :---: | :--- | :--- |
| **Greenhouse** (`boards.greenhouse.io`) | 🟢 Full Native | Public API & HTML Crawler | Native Setter + Multi-signal DOM |
| **Lever** (`jobs.lever.co`) | 🟢 Full Native | Public API & HTML Crawler | Native Setter + Multi-signal DOM |
| **Ashby** (`jobs.ashbyhq.com`) | 🟢 Full Native | Public API & HTML Crawler | React Synthetic State Sync |
| **Workday** (`*.myworkdayjobs.com`) | 🟢 Full Native | Headless Playwright Crawler | Deep shadow/data-automation-id bypass |
| **LinkedIn Jobs** (`linkedin.com/jobs`) | 🟡 Assisted | Crawler + In-Page Copilot | Easy Apply / External Apply detection |
| **BambooHR** (`*.bamboohr.com`) | 🟢 Full Native | In-Page Heuristic Engine | Multi-signal DOM Matcher |
| **SmartRecruiters** (`smartrecruiters.com`) | 🟢 Full Native | In-Page Heuristic Engine | Native Setter + Form Filler |
| **Taleo / iCIMS / Jobvite** | 🟡 Heuristic | In-Page Heuristic Engine | Generic Multi-Signal Fallback |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v18.17+` or `v20+` ([Download](https://nodejs.org/))
- **Python**: `3.10+` ([Download](https://python.org/))
- **Google Chrome** or any Chromium-based browser (Brave, Edge)
- **Ollama** *(Optional for local AI)*: ([Download](https://ollama.com/))
- **MongoDB** *(Optional)*: Local on `localhost:27017` or MongoDB Atlas URI (falls back to in-memory mode if omitted)

---

### Step 1: Install the Chrome Extension

1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the root folder of this repository:
   ```text
   <path-to-cloned-repo>/K-Apply
   ```
5. Pin **⚡ K-Apply** to your Chrome toolbar.

---

### Step 2: Launch the Next.js Command Center

1. Open your terminal and enter the `web-dashboard` directory:
   ```bash
   cd web-dashboard
   ```
2. Set up your environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *(Windows shortcut: run `start-dashboard.bat` directly from the repository root).*
5. Open [http://localhost:3000](http://localhost:3000) to access the landing page and navigate to `/dashboard` for the Command Center.
6. *(Optional)* Navigate to **Database & Sync** in the dashboard and click **"Initialize Missing Data"** to create the `profile`, `qa`, and `applications` collections with blank templates, then fill in your own details.

---

### Step 3: Set Up the Autonomous Hunter Engine

1. Open a new terminal and navigate to `JobHunter`:
   ```bash
   cd JobHunter
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies and Playwright browser binaries:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

---

### Step 4: Configure Local AI with Ollama *(Optional, Highly Recommended)*

1. Install Ollama and start the daemon:
   ```bash
   ollama serve
   ```
2. Download the default model (`llama3.1`):
   ```bash
   ollama pull llama3.1
   ```
3. Verify the local server responds:
   ```bash
   curl http://localhost:11434/api/tags
   ```

---

## 🎮 Usage Workflows

### Workflow 1: 1-Click In-Browser Autofill
1. Visit any job application page (e.g., Stripe on Greenhouse, Figma on Lever, or Ashby).
2. The **⚡ K-Apply** floating widget appears automatically in the bottom-right corner.
3. Click **Autofill Application**:
   - Every detected personal, experience, and legal field is filled in milliseconds.
   - The slide-out **Audit Drawer** displays a live summary of all populated and skipped fields.
4. Review the entries, attach your resume PDF, and submit with total confidence!

### Workflow 2: Autonomous Job Hunting & Match Scoring
Discover live openings at your target company and compute resume compatibility:
```bash
# Discover openings and generate STAR interview questions
python cli.py hunt --company stripe --portal greenhouse --role "Full Stack Engineer"

# View saved jobs in the local tracker
python cli.py list --min-score 70

# Launch Human-in-the-Loop browser autofill for a specific job
python cli.py apply --url "https://boards.greenhouse.io/stripe/jobs/1234567" --mode review
```

### Workflow 3: Instant AI Pitch & Answer Generation
1. Inside the Chrome Extension side drawer or the Command Center **AI Studio**:
2. Select **Generate AI Cover Letter** or choose any screening question.
3. Ollama generates a customized response tailored to the job description and your real experience in ~2 seconds.

---

## 🚢 Production Deployment & Packaging

K-Apply is engineered for enterprise-grade reproducibility and instant shipping.

### 📦 1. Chrome Web Store Packaging
Run the automated packaging script to validate manifests, check required assets, and create an upload-ready zip archive:
```bash
npm run package:ext
```
Artifact generated at `dist/k-apply-extension-v1.0.0.zip`. See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) for Chrome Web Store submission instructions.

### 🐳 2. Docker One-Command Production Stack
Deploy the Web Dashboard, MongoDB database, and Ollama LLM service together in isolated containers:
```bash
docker compose up -d
```
Access the Command Center at `http://localhost:3000`.

### 🧪 3. Comprehensive Verification Tests
Run the entire end-to-end test suite (Chrome Extension heuristics, Storage sync, Next.js DB fallback, and Python JobHunter engines):
```bash
npm run test:all
```

---

## ⚙️ Configuration & Environment

### Web Dashboard (`web-dashboard/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) | `mongodb://localhost:27017/kapply` |
| `MONGODB_DB` | Target database name | `kapply` |
| `OLLAMA_BASE_URL` | Local or remote Ollama HTTP endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Default LLM model tag | `llama3.1` |
| `OLLAMA_API_KEY` | Optional bearer token for hosted Ollama proxies | *(empty)* |
| `PORT` | Next.js server port | `3000` |

### Autonomous Hunter (`JobHunter/config/settings.yaml`)
| Setting | Description | Default |
| :--- | :--- | :--- |
| `defaults.target_role` | Default search title | `"Full Stack Engineer"` |
| `defaults.locations` | Target geographic or remote filters | `["Remote", "United States", "India"]` |
| `defaults.min_match_score`| Threshold for auto-shortlisting jobs | `50` |
| `app.default_mode` | Execution mode (`review` for HITL or `auto`) | `"review"` |
| `app.headless_browser` | Run Playwright in headless mode | `false` |

---

## 📁 Repository Directory Map

```text
K-Apply/
├── manifest.json              # Chrome Manifest V3 configuration
├── package.json               # Root monorepo workspace & test orchestration scripts
├── docker-compose.yml         # Full production stack (Dashboard + Mongo + Ollama)
├── scripts/                   # Release & packaging scripts (Chrome Web Store builder)
│   └── package-extension.mjs  # Validates manifest & creates distribution zip
├── test/                      # Multi-tier verification test suite
│   ├── verify.js              # Variable interpolation & Q&A data verification
│   ├── test-storage.js        # Chrome storage CRUD tests
│   ├── test-autofill-results.js# Label extraction & filled/skipped audit tests
│   └── test-web-db.js         # Web dashboard in-memory fallback CRUD tests
├── .github/                   # CI/CD Workflows
│   └── workflows/
│       ├── ci.yml             # Matrix testing (Node 18/20, Python 3.10/3.11)
│       └── release.yml        # Tagged release packaging & checksums
│
├── background/                # Chrome Service Worker
│   └── service-worker.js      # Tab lifecycle, badge coordination, cross-origin fetch
│
├── content/                   # Browser DOM Ingestion & UI Layer
│   ├── content-script.js      # Form scanner, field mapper & side drawer controller
│   ├── autofill-engine.js     # React synthetic dispatcher & field scoring engine
│   ├── matcher.js             # Fuzzy matching & template variable interpolator
│   └── floating-widget.css    # Responsive styles for floating button & audit drawer
│
├── popup/                     # Chrome Extension Popup
│   ├── popup.html             # Popup layout with quick actions & tracker sync
│   └── popup.js               # Tab communication & active page detection
│
├── dashboard/                 # In-Extension Standalone HTML/CSS/JS Dashboard
│
├── utils/                     # Automation Engine Utilities
│   ├── events.js              # Native prototype setter override & synthetic event emitter
│   ├── extractor.js           # Multi-ATS DOM job metadata extractor
│   └── storage.js             # Chrome sync/local storage abstraction layer
│
├── web-dashboard/             # Next.js 16 SaaS Product & Full Command Center
│   ├── Dockerfile             # Multi-stage production container image
│   ├── app/
│   │   ├── page.jsx           # SaaS Product Landing Page & Interactive ROI Demo
│   │   ├── dashboard/         # Command Center (Kanban, Table, AI Studio, Radar, Vault)
│   │   └── api/               # REST Endpoints (/applications, /hunter, /ai/*, /qa, /profile)
│   ├── lib/                   # MongoDB pooling & Ollama local AI client
│   └── package.json           # Next.js, React 19, and MongoDB dependencies
│
├── JobHunter/                 # Autonomous ATS Discovery & Playwright Automation
│   ├── pyproject.toml         # Standard Python packaging configuration
│   ├── cli.py                 # Unified CLI (hunt, intel, list, apply)
│   ├── requirements.txt       # Playwright, BeautifulSoup4, Rich, Streamlit, PyYAML
│   ├── core/
│   │   ├── discovery/         # Greenhouse, Lever, Ashby, Workday, LinkedIn crawlers
│   │   ├── intelligence/      # STAR answer generator & interview question predictor
│   │   └── automation/        # Playwright browser manager & form filler
│   ├── tests/                 # Component, AnswerEngine, and integration tests
│   └── ui/                    # FastAPI server & Streamlit interactive dashboard
│
└── docs/                      # Comprehensive Architecture & Engineering Documentation
    ├── PRODUCTION_DEPLOYMENT.md# Chrome Web Store packaging, Docker & cloud deployment
    ├── ARCHITECTURE.md        # Multi-tier architecture blueprint & IPC pipelines
    ├── EXTENSION_INTERNALS.md # React _valueTracker bypass & heuristic matrices
    ├── AUTONOMOUS_HUNTER.md   # Multi-ATS scrapers, match math & HITL runner
    ├── COMMAND_CENTER_AND_API.md # REST endpoints, database schemas & pooling
    ├── CANDIDATE_DATA.md      # Candidate profile schema & screening answer templates
    ├── ATS_FIELD_MAPPINGS.md  # Field heuristic scoring & selector references
    ├── DATA_SCHEMAS_AND_SEEDS.md # MongoDB, SQLite & Chrome storage schemas
    ├── DATA_FLOW_AND_SECURITY.md # Zero-telemetry model & privacy architecture
    └── CONFIGURATION_AND_SETUP.md # Step-by-step operations & troubleshooting
```

---

## 📚 Documentation & Knowledge Base

For in-depth specifications, visit the [`docs/`](docs/) directory:

- 🏛️ [**System Architecture & Engineering Blueprint**](docs/ARCHITECTURE.md): Multi-tier IPC communication, sequence diagrams, and cross-layer state pipelines.
- ⚡ [**Extension Internals & DOM Automation**](docs/EXTENSION_INTERNALS.md): Deep-dive on React synthetic event injection, prototype setters, and multi-signal heuristics.
- 🎯 [**Autonomous Hunter Engine**](docs/AUTONOMOUS_HUNTER.md): Crawler design, resume match scoring algorithms, and Playwright execution modes.
- 📊 [**Command Center & REST API Reference**](docs/COMMAND_CENTER_AND_API.md): Full documentation for all `/api/*` endpoints and database connections.
- 📝 [**Candidate Master Data & Screening Vault**](docs/CANDIDATE_DATA.md): Full screening question answers, STAR incident case studies, and salary ranges.
- 🔍 [**ATS Field Mappings & Detection**](docs/ATS_FIELD_MAPPINGS.md): Complete heuristic scoring table and regex pattern dictionary.
- 🗄️ [**Data Schemas & Seeds**](docs/DATA_SCHEMAS_AND_SEEDS.md): MongoDB collections, SQLite tables, and Chrome local storage specs.
- 🔒 [**Data Flow, Privacy & Security**](docs/DATA_FLOW_AND_SECURITY.md): Zero-telemetry proof, local Ollama execution, and security guidelines.
- 🚀 [**Production Deployment & Store Publishing**](docs/PRODUCTION_DEPLOYMENT.md): Chrome Web Store packaging, Docker multi-stage deployment, and CI/CD pipelines.
- ⚙️ [**Configuration, Setup & Operations Guide**](docs/CONFIGURATION_AND_SETUP.md): Troubleshooting common installation and operating scenarios.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Why do React form inputs sometimes clear when using generic autofill tools?</b></summary>
React wraps input elements with an internal <code>_valueTracker</code> property. When you change an input's value using <code>element.value = 'text'</code>, React does not recognize the property assignment and immediately overwrites it with internal state on re-render. K-Apply solves this by calling the original native prototype setter (<code>HTMLInputElement.prototype</code>) and explicitly dispatching synthetic <code>input</code>, <code>change</code>, and <code>blur</code> events.
</details>

<details>
<summary><b>Does K-Apply send my resume or answers to external servers?</b></summary>
<b>No.</b> K-Apply is designed with a strict zero-telemetry policy. All candidate data, work history, and compensation preferences are stored locally in your browser's Chrome storage, your local MongoDB instance, or local SQLite files. When using Ollama, all AI generation runs entirely on your own GPU/CPU without connecting to any third-party cloud.
</details>

<details>
<summary><b>What happens if I don't have MongoDB installed?</b></summary>
The Next.js Command Center automatically detects when MongoDB is unavailable and activates an in-memory fallback layer. You can explore the landing page, view mock data, and test UI components immediately without installing MongoDB.
</details>

<details>
<summary><b>Can I run K-Apply completely automated without manual review?</b></summary>
While JobHunter supports <code>--mode auto</code>, we strongly recommend <b>Human-in-the-Loop (<code>--mode review</code>)</b>. Review mode pre-fills 100% of the application and pauses the browser so you can verify company-specific edge cases, review attachments, and maintain authentic control over your job search.
</details>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<b>Take back control of your career journey with ⚡ K-Apply.</b><br/>
<i>Crafted for ambitious software engineers and technical professionals.</i>
</div>
