# 🚀 K-Apply Production Deployment & Distribution Guide

This document provides complete instructions for publishing the Chrome Extension, deploying the Next.js Command Center to production, running the Autonomous Hunter, and managing environments securely.

---

## 📑 Table of Contents

1. [Chrome Extension Production Release](#1-chrome-extension-production-release)
   - [Packaging the Extension](#packaging-the-extension)
   - [Chrome Web Store Submission Checklist](#chrome-web-store-submission-checklist)
   - [Permission Justifications for Reviewers](#permission-justifications-for-reviewers)
2. [Web Dashboard & Command Center Deployment](#2-web-dashboard--command-center-deployment)
   - [Option A: Docker Compose (All-in-One Production)](#option-a-docker-compose-all-in-one-production)
   - [Option B: Cloud Deployment (Vercel / Render / Railway)](#option-b-cloud-deployment-vercel--render--railway)
   - [Database: MongoDB Atlas Production Setup](#database-mongodb-atlas-production-setup)
   - [AI Engine: Ollama Local vs Cloud API](#ai-engine-ollama-local-vs-cloud-api)
3. [JobHunter Automation Deployment](#3-jobhunter-automation-deployment)
   - [Headless vs Review Mode](#headless-vs-review-mode)
   - [Scheduling Recurring Hunts](#scheduling-recurring-hunts)
4. [Security & Compliance Checklist](#4-security--compliance-checklist)

---

## 1. Chrome Extension Production Release

### Packaging the Extension

The repository includes an automated packaging pipeline that validates your `manifest.json`, ensures all required files and icons exist, strips out developer files, and creates an optimized `.zip` archive ready for upload:

```bash
npm run package:ext
```

This generates:
- `dist/k-apply-extension-v1.0.0.zip` (Clean compressed bundle)
- `dist/extension-unpacked/` (Unpacked staging directory)

### Chrome Web Store Submission Checklist

1. **Google Chrome Web Store Developer Account**:
   - Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
   - One-time developer registration fee (\$5 USD).
2. **Upload Package**:
   - Click **Add new item**.
   - Upload `dist/k-apply-extension-v1.0.0.zip`.
3. **Store Listing Assets**:
   - **Detailed Description**: Explain features, local-first storage, supported ATS systems.
   - **Icons**: 128x128 PNG (included in `icons/icon128.png`).
   - **Screenshots**: At least 1 screenshot (1280x800 or 640x400 PNG/JPEG) showing the autofill widget and audit drawer in action.
   - **Promotional Tile (Small)**: 440x280 PNG.
4. **Privacy Practices Tab**:
   - **Single Purpose**: "Autofills job applications across ATS portals and tracks application progress locally."
   - **Host Permissions Rationale**: Needed to inject the form autofill engine on job application pages across various company domains.
   - **Data Usage Declaration**: Select "No user data is sold or transferred to third parties; all candidate data is stored locally on the user's machine."

### Permission Justifications for Reviewers

When prompted by the Chrome Web Store review team:

| Permission | Justification |
| :--- | :--- |
| `storage` | Stores user candidate profile, Q&A responses, and tracked job application records locally. |
| `activeTab` | Detects job posting details (title, company, URL) on the currently active tab when user invokes autofill. |
| `scripting` | Executes the React-synthetic event dispatcher and form matching engine on application forms. |
| `<all_urls>` | Required because job applications are hosted on arbitrary employer domains and ATS subdomains (e.g., `*.greenhouse.io`, `*.lever.co`, `*.myworkdayjobs.com`, `careers.*.com`). |

---

## 2. Web Dashboard & Command Center Deployment

### Option A: Docker Compose (All-in-One Production)

Deploy the entire production stack (Web Dashboard + MongoDB + Ollama) with a single command:

```bash
# 1. Clone repository on your production host
git clone <repo-url>
cd K-Apply

# 2. Start services in the background
docker compose up -d
```

Verify services:
```bash
docker compose ps
```

- **Dashboard**: `http://<server-ip>:3000`
- **MongoDB**: `localhost:27017`
- **Ollama**: `http://localhost:11434`

To pull a model into the Ollama container:
```bash
docker exec -it k-apply-ollama ollama pull llama3.1
```

### Option B: Cloud Deployment (Vercel / Render / Railway)

#### Deploy to Vercel:
1. Push repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Set **Root Directory** to `web-dashboard`.
4. Configure Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `MONGODB_DB`: `kapply`
   - `OLLAMA_BASE_URL`: URL to your hosted Ollama or Cloud LLM proxy.
   - `OLLAMA_MODEL`: `llama3.1` (or your chosen model).
   - `OLLAMA_API_KEY`: API key if your endpoint requires authentication.
5. Click **Deploy**.

### Database: MongoDB Atlas Production Setup

1. Create a free M0 or production cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with Read/Write privileges.
3. Under **Network Access**, add your server IP or `0.0.0.0/0` (with strong user credentials).
4. Copy the connection string and add to your environment:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=kapply
   ```

*Note: If MongoDB is omitted or unreachable, K-Apply automatically operates in resilient in-memory mode without crashing.*

### AI Engine: Ollama Local vs Cloud API

- **Local Ollama**: Ensure Ollama is running (`ollama serve`) on port 11434.
- **Remote / Cloud Ollama**: Set `OLLAMA_BASE_URL=https://your-hosted-ollama.example.com` and `OLLAMA_API_KEY=your_token`.

---

## 3. JobHunter Automation Deployment

### Headless vs Review Mode

Configure `JobHunter/config/settings.yaml`:

```yaml
app:
  name: "JobHunter AI"
  version: "1.0.0"
  default_mode: "review"   # "review" pauses for HITL verification; "auto" submits directly
  headless_browser: true   # Set to true for server / background operation
```

### Scheduling Recurring Hunts

#### Linux / macOS (Cron):
Run a daily hunt at 9:00 AM:
```bash
0 9 * * 1-5 cd /path/to/K-Apply/JobHunter && python cli.py hunt --company stripe --role "Software Engineer" >> /var/log/k-apply-hunt.log 2>&1
```

#### Windows (Task Scheduler / PowerShell):
Create a scheduled task using PowerShell:
```powershell
$Action = New-ScheduledTaskAction -Execute 'python.exe' -Argument 'cli.py hunt --company stripe --role "Software Engineer"' -WorkingDirectory 'C:\path\to\K-Apply\JobHunter'
$Trigger = New-ScheduledTaskTrigger -Daily -At 9am
Register-ScheduledTask -TaskName "KApplyDailyHunt" -Action $Action -Trigger $Trigger
```

---

## 4. Security & Compliance Checklist

- [x] **No Secrets Committed**: `.env.local` and `.env*.local` are explicitly excluded via `.gitignore`.
- [x] **Zero Cloud Telemetry**: Resume data and answers never leave the local environment unless explicitly routed to user-configured cloud endpoints.
- [x] **CORS Isolation**: All API endpoints support configured CORS origins.
- [x] **Sanitized Dynamic Injection**: React synthetic event dispatches use prototype setters without executing unsanitized raw strings in global scope.
- [x] **Non-Root Container**: Docker container runs as unprivileged `nextjs` user (`uid 1001`).
- [x] **Package Integrity**: Automated CI matrix validates builds on Node 18/20 and Python 3.10/3.11 with checksum verification.
