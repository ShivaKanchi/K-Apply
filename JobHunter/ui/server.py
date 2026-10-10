import os
import sys
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from core.profile.profile_manager import ProfileManager
from core.profile.resume_parser import ResumeParser
from core.discovery.greenhouse_api import GreenhouseConnector
from core.discovery.lever_api import LeverConnector
from core.discovery.ashby_api import AshbyConnector
from core.discovery.workday_crawler import WorkdayCrawler
from core.discovery.linkedin_crawler import LinkedinCrawler
from core.discovery.matcher import JobMatcher
from core.intelligence.question_generator import QuestionGenerator
from core.tracker.db import JobTrackerDB

app = FastAPI(title="K-Apply Hunter - Autonomous Automation Module")

db = JobTrackerDB()
q_gen = QuestionGenerator()
default_resume_path = "data/sample_resume.md"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K-Apply Hunter - Autonomous Job Discovery & Autofill</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <header class="flex items-center justify-between pb-6 border-b border-slate-200">
            <div>
                <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>🎯</span> K-Apply Hunter
                </h1>
                <p class="text-sm text-slate-500 mt-1">Autonomous Job Discovery, Screening & Interview Intelligence, and Autofill Engine • K-Apply Suite</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    ● Autonomous Automation Worker
                </span>
            </div>
        </header>

        <!-- Main Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <!-- Left Column: Controls & Search -->
            <div class="space-y-6">
                <!-- Profile & Target Role Card -->
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>👤</span> Profile & Preferences
                    </h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase">Target Role</label>
                            <input id="targetRole" type="text" value="Full Stack Engineer" class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            <span class="text-xs text-slate-400">Adaptable at runtime to any role</span>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase">Execution Mode</label>
                            <select id="execMode" class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                                <option value="review" selected>Review Mode (HITL - Pause to Confirm)</option>
                                <option value="auto">Auto-Submit Mode</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase">Resume Source</label>
                            <div class="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex justify-between items-center">
                                <span id="resumeStatus">data/sample_resume.md</span>
                                <span class="text-indigo-600 font-semibold">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Search Company Card -->
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>🔍</span> Search & Discovery
                    </h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase">Company Name / Board Slug</label>
                            <input id="companyInput" type="text" placeholder="e.g. stripe, gitlab, figma, netflix" value="stripe" class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase">Job Portal / ATS</label>
                            <select id="portalInput" class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                                <option value="greenhouse" selected>Greenhouse (Public API)</option>
                                <option value="lever">Lever (Public API)</option>
                                <option value="ashby">Ashby (Public API)</option>
                                <option value="workday">Workday (CXS)</option>
                                <option value="linkedin">LinkedIn (Guest Search)</option>
                                <option value="auto">Auto-Detect</option>
                            </select>
                        </div>
                        <button onclick="runSearch()" id="searchBtn" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition shadow-sm flex justify-center items-center gap-2">
                            <span>🚀</span> Discover Jobs & Intelligence
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right Column: Results & Intelligence Tabs -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Navigation Tabs -->
                <div class="flex border-b border-slate-200 gap-6 text-sm font-semibold">
                    <button onclick="switchTab('jobsTab')" id="tabBtnJobs" class="pb-3 border-b-2 border-indigo-600 text-indigo-600">
                        Discovered Jobs (<span id="jobsCount">0</span>)
                    </button>
                    <button onclick="switchTab('intelTab')" id="tabBtnIntel" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800">
                        🧠 Interview & Screening Intel
                    </button>
                    <button onclick="switchTab('trackerTab')" id="tabBtnTracker" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800">
                        📊 Saved Tracker
                    </button>
                </div>

                <!-- Tab 1: Discovered Jobs -->
                <div id="jobsTab" class="space-y-4">
                    <div id="loadingIndicator" class="hidden p-8 text-center text-slate-500">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                        <p class="text-sm">Fetching jobs and matching against candidate skills...</p>
                    </div>

                    <div id="jobsList" class="space-y-3">
                        <div class="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
                            Enter a company name and portal, then click "Discover Jobs" to start.
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Intelligence & Questions -->
                <div id="intelTab" class="hidden space-y-6">
                    <div id="intelContent" class="space-y-6">
                        <div class="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
                            Search for a company to view the tailor-made screening answers and most asked interview questions.
                        </div>
                    </div>
                </div>

                <!-- Tab 3: Saved Tracker -->
                <div id="trackerTab" class="hidden space-y-4">
                    <div class="bg-white p-6 rounded-xl border border-slate-200">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-slate-800">Application Pipeline</h3>
                            <button onclick="loadTracker()" class="text-xs text-indigo-600 font-semibold hover:underline">Refresh</button>
                        </div>
                        <div id="trackerList" class="space-y-2 text-sm text-slate-600">
                            Loading tracker data...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentIntel = null;

        function switchTab(tabId) {
            ['jobsTab', 'intelTab', 'trackerTab'].forEach(t => document.getElementById(t).classList.add('hidden'));
            ['tabBtnJobs', 'tabBtnIntel', 'tabBtnTracker'].forEach(b => {
                document.getElementById(b).classList.remove('border-indigo-600', 'text-indigo-600');
                document.getElementById(b).classList.add('border-transparent', 'text-slate-500');
            });

            document.getElementById(tabId).classList.remove('hidden');
            if (tabId === 'jobsTab') {
                document.getElementById('tabBtnJobs').classList.add('border-indigo-600', 'text-indigo-600');
            } else if (tabId === 'intelTab') {
                document.getElementById('tabBtnIntel').classList.add('border-indigo-600', 'text-indigo-600');
            } else if (tabId === 'trackerTab') {
                document.getElementById('tabBtnTracker').classList.add('border-indigo-600', 'text-indigo-600');
                loadTracker();
            }
        }

        async function runSearch() {
            const company = document.getElementById('companyInput').value.trim();
            const portal = document.getElementById('portalInput').value;
            const role = document.getElementById('targetRole').value.trim();

            if (!company) return alert('Please enter a company name.');

            document.getElementById('loadingIndicator').classList.remove('hidden');
            document.getElementById('jobsList').innerHTML = '';

            try {
                const resp = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ company, portal, role })
                });
                const data = await resp.json();
                document.getElementById('loadingIndicator').classList.add('hidden');

                if (data.jobs && data.jobs.length > 0) {
                    document.getElementById('jobsCount').innerText = data.jobs.length;
                    renderJobs(data.jobs);
                    renderIntel(data.intel);
                } else {
                    document.getElementById('jobsList').innerHTML = `
                        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center text-sm">
                            No jobs found for "${company}" on portal "${portal}". Try another slug or portal.
                        </div>
                    `;
                }
            } catch (err) {
                document.getElementById('loadingIndicator').classList.add('hidden');
                alert('Search error: ' + err);
            }
        }

        function renderJobs(jobs) {
            const container = document.getElementById('jobsList');
            container.innerHTML = '';

            jobs.forEach(j => {
                const scoreColor = j.score >= 70 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                  (j.score >= 45 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300');

                const card = document.createElement('div');
                card.className = "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4";
                card.innerHTML = `
                    <div class="space-y-1 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreColor}">
                                ${j.score}% Match
                            </span>
                            <span class="text-xs uppercase font-semibold text-slate-400 tracking-wider">${j.portal}</span>
                        </div>
                        <h4 class="text-base font-bold text-slate-900">${j.title}</h4>
                        <p class="text-xs text-slate-500">📍 ${j.location || 'Remote/Unspecified'}</p>
                        ${j.analysis.matched_skills.length > 0 ? 
                            `<p class="text-xs text-indigo-600 font-medium">Matched: ${j.analysis.matched_skills.slice(0, 4).join(', ')}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="${j.apply_url}" target="_blank" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                            Open Link ↗
                        </a>
                        <button onclick="triggerAutofill('${j.apply_url}', '${j.title}')" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1">
                            ⚡ Autofill
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function renderIntel(intel) {
            currentIntel = intel;
            const container = document.getElementById('intelContent');
            if (!intel) return;

            let html = `
                <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                    <h3 class="text-lg font-bold text-slate-900">🏢 ${intel.company.name} Intelligence</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                            <span class="font-semibold text-slate-500">Domain:</span>
                            <p class="text-slate-800 font-medium mt-0.5">${intel.company.domain}</p>
                        </div>
                        <div>
                            <span class="font-semibold text-slate-500">Core Values:</span>
                            <p class="text-slate-800 font-medium mt-0.5">${intel.company.values.join(', ')}</p>
                        </div>
                    </div>
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span class="font-bold text-slate-900">Known Interview Format:</span> ${intel.company.interview_style}
                    </div>
                </div>

                <!-- Screening Q&A -->
                <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
                    <h3 class="text-md font-bold text-slate-900">📝 Application Screening Answers (Tailored to Resume)</h3>
                    ${intel.screening_qa.map(qa => `
                        <div class="border border-slate-100 rounded-lg p-3 bg-slate-50">
                            <p class="text-xs font-bold text-slate-800">Q: ${qa.question}</p>
                            <p class="text-xs text-slate-600 mt-1 leading-relaxed">${qa.answer}</p>
                        </div>
                    `).join('')}
                </div>

                <!-- Interview Questions -->
                <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                    <h3 class="text-md font-bold text-slate-900">🔥 Top Most Asked Interview Questions</h3>
                    <div class="space-y-3">
                        <h5 class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Technical & System Design</h5>
                        ${intel.interview_questions.technical.map((t, idx) => `
                            <div class="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
                                <p class="font-bold text-slate-800">${idx + 1}. ${t.question}</p>
                                <p class="text-slate-500"><span class="font-semibold text-slate-600">Concepts:</span> ${t.key_concepts}</p>
                            </div>
                        `).join('')}

                        <h5 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-4">Behavioral & Culture Fit</h5>
                        ${intel.interview_questions.behavioral.map((b, idx) => `
                            <div class="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
                                <p class="font-bold text-slate-800">${idx + 1}. ${b.question}</p>
                                <p class="text-slate-500"><span class="font-semibold text-slate-600">Strategy:</span> ${b.tip}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            container.innerHTML = html;
        }

        async function triggerAutofill(url, title) {
            const mode = document.getElementById('execMode').value;
            const role = document.getElementById('targetRole').value;

            alert(`Launching Playwright in ${mode.toUpperCase()} mode to autofill: ${title}\\n\\nThe browser window will open.`);
            try {
                await fetch('/api/autofill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, title, mode, role })
                });
            } catch (e) {
                console.error(e);
            }
        }

        async function loadTracker() {
            try {
                const resp = await fetch('/api/tracker');
                const jobs = await resp.json();
                const container = document.getElementById('trackerList');
                if (jobs.length === 0) {
                    container.innerHTML = '<p class="text-xs text-slate-400">No jobs saved yet.</p>';
                    return;
                }
                container.innerHTML = jobs.map(j => `
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                        <div>
                            <span class="font-bold text-slate-900">${j.title}</span> (${j.company.toUpperCase()} - ${j.portal})
                            <p class="text-slate-400 text-[11px]">Added: ${j.discovered_at.split('T')[0]} | Score: ${j.match_score}%</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">${j.status}</span>
                            <a href="${j.apply_url}" target="_blank" class="text-indigo-600 font-semibold hover:underline">Apply ↗</a>
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                console.error(e);
            }
        }
    </script>
</body>
</html>
"""

class SearchRequest(BaseModel):
    company: str
    portal: str = "greenhouse"
    role: str = "Full Stack Engineer"

class AutofillRequest(BaseModel):
    url: str
    title: str
    mode: str = "review"
    role: str = "Full Stack Engineer"

@app.get("/", response_class=HTMLResponse)
async def get_index():
    return HTML_TEMPLATE

@app.post("/api/search")
async def search_jobs(req: SearchRequest):
    profile_mgr = ProfileManager(resume_path=default_resume_path)
    profile = profile_mgr.get_consolidated_profile(target_role=req.role)

    # 1. Fetch Intel
    intel = q_gen.generate_intelligence_pack(
        company_name=req.company,
        target_role=req.role,
        candidate_profile=profile
    )

    # 2. Fetch Jobs
    raw_jobs = []
    p = req.portal.lower()
    if p == "greenhouse":
        raw_jobs = GreenhouseConnector().fetch_jobs(req.company)
    elif p == "lever":
        raw_jobs = LeverConnector().fetch_jobs(req.company)
    elif p == "ashby":
        raw_jobs = AshbyConnector().fetch_jobs(req.company)
    elif p == "workday":
        raw_jobs = WorkdayCrawler().fetch_jobs(req.company)
    elif p == "linkedin":
        raw_jobs = LinkedinCrawler().search_jobs(keywords=req.role, company=req.company)
    else:
        for conn in [GreenhouseConnector(), LeverConnector(), AshbyConnector()]:
            res = conn.fetch_jobs(req.company)
            if res:
                raw_jobs = res
                break

    matcher = JobMatcher(target_role=req.role, candidate_skills=profile["skills"])
    results = []
    for j in raw_jobs:
        score, analysis = matcher.score_job(j)
        job_id = db.add_or_update_job(j, match_score=score)
        results.append({
            "id": job_id,
            "title": j.get("title"),
            "company": req.company,
            "portal": j.get("portal"),
            "location": j.get("location"),
            "apply_url": j.get("apply_url"),
            "score": score,
            "analysis": analysis
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"jobs": results[:25], "intel": intel}

@app.get("/api/tracker")
async def get_tracker():
    return db.list_jobs()

@app.post("/api/autofill")
async def trigger_autofill_api(req: AutofillRequest):
    # Runs autofill logic
    profile_mgr = ProfileManager(resume_path=default_resume_path)
    profile = profile_mgr.get_consolidated_profile(target_role=req.role)
    try:
        from core.automation.browser_manager import BrowserManager
        from core.automation.form_filler import FormFiller
        from core.automation.submission import SubmissionController

        bm = BrowserManager(headless=False)
        page = bm.open_url(req.url)
        filler = FormFiller(profile)
        report = filler.autofill(page)
        ctrl = SubmissionController(mode=req.mode)
        result = ctrl.handle_submission(page, report, req.title)
        return {"success": True, "report": report, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8501)
