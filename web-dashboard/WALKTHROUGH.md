# 🚀 K-Apply Next.js + MongoDB Dashboard Walkthrough & Sharing Guide

This walkthrough covers how to run, configure, seed, and share the full-stack Next.js dashboard connected to MongoDB.

---

## 🏗️ Architecture & Technical Design

```mermaid
flowchart TD
    Ext[⚡ K-Apply Chrome Extension] -->|Autofill & 1-Click Track| ATS[Job Portals (Greenhouse, Lever, Ashby, etc.)]
    Ext -->|POST /api/applications| NextAPI[Next.js App Router Backend API]
    User[Candidate / User] -->|Views & Manages| Dash[Next.js Web Dashboard]
    Dash --> NextAPI
    NextAPI --> Pool[Connection Pool & In-Memory Fallback]
    Pool -->|MONGODB_URI configured| Mongo[(MongoDB Atlas / Local DB)]
    Pool -->|MONGODB_URI missing / offline| Mem[(Resilient Memory Store)]
```

### 1. Reusable
- **Universal APIs**: Standard RESTful endpoints (`/api/applications`, `/api/qa`, `/api/profile`, `/api/seed`, `/api/health`) with global CORS headers so external tools, webhooks, or Chrome extensions can interact directly.
- **Componentized Structure**: Distinct views for Kanban, Table, Q&A Library, and Candidate Profile.

### 2. Maintainable
- Modular Next.js App Router with database logic centralized in [`lib/db-operations.js`](./lib/db-operations.js).
- Clear separation between MongoDB data layer, API serialization, and React presentation.

### 3. Clean & Simple
- Sleek dark/light theme, real-time connection status pill (🟢 Connected vs 🟡 In-Memory Mode).
- Instant live search, status pills, and toggle between detailed Data Table and Kanban Board.

### 4. Error Handling & Fallbacks
- **Serverless Connection Caching**: Cached `clientPromise` prevents connection exhaustion during Next.js Hot Module Replacement (HMR).
- **Graceful In-Memory Fallback**: If MongoDB is not yet configured or temporarily offline, the dashboard seamlessly switches to a memory store rather than throwing 500 errors.
- **Non-blocking Extension Sync**: Chrome extension uses an `AbortController` timeout when posting to the backend, ensuring browser autofill never hangs even if the Next.js server is stopped.

---

## 🏃 Quickstart: Running the Dashboard

### 1. Install & Configure Environment
Navigate to the `web-dashboard` directory:
```bash
cd web-dashboard
```

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB connection string:
- **For MongoDB Atlas (Cloud - Free Tier)**:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/kapply?retryWrites=true&w=majority
  MONGODB_DB=kapply
  ```
- **For Local MongoDB**:
  ```env
  MONGODB_URI=mongodb://localhost:27017/kapply
  MONGODB_DB=kapply
  ```
> **Note:** If you haven't set up MongoDB yet, you can still start the server immediately! The app will run in resilient demo mode and notify you with clear instructions.

### 2. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🌱 1-Click Seeding

K-Apply ships with **blank templates** — no user data is included. To create the collections and add your own data:
1. Open the dashboard at `http://localhost:3000`.
2. Go to the **Database & Sync** tab in the sidebar.
3. Click **"Initialize Missing Data"** (or **"Force Re-Seed"**).
4. The `applications`, `qa`, and `profile` collections will be created with blank templates so you can fill in your own details.

---

## 🤖 Ollama Cloud / Local AI Cover Letter Generator

The dashboard and Chrome Extension use **Ollama** to dynamically craft tailored cover letters and answer custom application screening questions:

### Configuration in `.env.local`:
```env
# Local Ollama:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Ollama Cloud / Hosted Proxy:
# OLLAMA_BASE_URL=https://your-ollama-cloud-host.com
# OLLAMA_API_KEY=your_optional_api_key
```

### Features:
1. **Tailored Cover Letter Generator**:
   - Grounds the generated letter in your own profile and Q&A answers for the specific job description and company.
   - 1-click **Copy to Clipboard**, **Save to Q&A Library**, or **Track as Application**.
2. **AI Screening Answerer**:
   - Answers specific questions (e.g. *"Describe a production challenge you resolved"*) grounded in your real background.
3. **Chrome Extension 1-Click AI Fill**:
   - In-page floating menu includes **"✨ AI Cover Letter (Ollama)"** which calls the Next.js AI API and fills the cover letter field on the page automatically.
4. **Resilient Fallback**:
   - If Ollama is offline or times out, the system automatically falls back to your saved Q&A templates with dynamic variable substitution (`{{company_name}}`, `{{role}}`).

---

## 🌐 Deploying & Sharing Online (Vercel + MongoDB Atlas)

You can share your live dashboard URL with recruiters, mentors, or access it from any device:

### Step 1: Create a Free MongoDB Atlas Database
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a free shared cluster (**M0**).
3. Under **Database Access**, create a database user.
4. Under **Network Access**, click **Add IP Address** $\rightarrow$ select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** $\rightarrow$ **Drivers** $\rightarrow$ copy your `mongodb+srv://...` URI.

### Step 2: Deploy to Vercel (1-Click)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "K-Apply full-stack dashboard"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set the **Root Directory** to `web-dashboard`.
4. In **Environment Variables**, add:
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `MONGODB_DB`: `kapply`
5. Click **Deploy**!
6. Vercel will give you a public URL to share or view anywhere.
