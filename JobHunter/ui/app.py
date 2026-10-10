import os
import sys
from pathlib import Path
import streamlit as st
import pandas as pd

# Add root directory to sys.path
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
from core.automation.browser_manager import BrowserManager
from core.automation.form_filler import FormFiller
from core.automation.submission import SubmissionController

st.set_page_config(
    page_title="K-Apply Hunter - Autonomous Job Discovery & Autofill",
    page_icon="🎯",
    layout="wide"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
    .stButton>button {
        border-radius: 6px;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SIDEBAR CONFIG -----------------
with st.sidebar:
    st.title("🎯 K-Apply Hunter")
    st.caption("Autonomous Discovery, Question Intelligence & Autofill • K-Apply Suite")

    st.markdown("### 1. Target Role & Profile")
    target_role = st.text_input("Target Job Role", value="Full Stack Engineer", help="Adaptable to any role at runtime")

    # Resume File Upload
    uploaded_resume = st.file_uploader("Upload Resume (PDF, DOCX, MD)", type=["pdf", "docx", "md", "txt"])
    resume_path = "data/sample_resume.md"

    if uploaded_resume is not None:
        save_path = Path("data") / uploaded_resume.name
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(uploaded_resume.getbuffer())
        resume_path = str(save_path)
        st.success(f"Loaded: {uploaded_resume.name}")
    else:
        st.info("Using baseline: sample_resume.md")

    # Mode Selection (Toggleable HITL)
    st.markdown("### 2. Execution Mode")
    exec_mode = st.radio(
        "Application Mode",
        options=["Review Mode (HITL)", "Auto-Submit Mode"],
        index=0,
        help="Review Mode pauses with the browser open for your 1-click verification before submit."
    )
    mode_str = "review" if "Review" in exec_mode else "auto"

    st.markdown("### 3. Locations")
    preferred_locs = st.multiselect(
        "Preferred Locations",
        options=["Remote", "United States", "India", "San Francisco", "New York", "Hybrid"],
        default=["Remote", "United States"]
    )

# Initialize Manager & Profile
profile_mgr = ProfileManager(resume_path=resume_path)
profile = profile_mgr.get_consolidated_profile(target_role=target_role)
db = JobTrackerDB()
q_gen = QuestionGenerator()

# ----------------- MAIN APP TABS -----------------
tab1, tab2, tab3 = st.tabs(["🔍 Job Discovery & Autofill", "🧠 Question & Interview Intelligence", "📊 Application Tracker"])

# ================= TAB 1: JOB DISCOVERY =================
with tab1:
    st.subheader("Job Search & Public ATS Discovery")
    
    col1, col2, col3 = st.columns([2, 1.5, 1])
    with col1:
        company_input = st.text_input("Company Name / Board Slug", value="stripe", help="e.g., stripe, figma, gitlab, netflix, notion")
    with col2:
        portal_input = st.selectbox("Job Portal / ATS", options=["greenhouse", "lever", "ashby", "workday", "linkedin", "auto"])
    with col3:
        st.write("")
        st.write("")
        search_btn = st.button("🚀 Discover Jobs", type="primary", use_container_width=True)

    if search_btn and company_input:
        with st.spinner(f"Querying {portal_input.upper()} for openings at '{company_input}'..."):
            raw_jobs = []
            if portal_input == "greenhouse":
                raw_jobs = GreenhouseConnector().fetch_jobs(company_input)
            elif portal_input == "lever":
                raw_jobs = LeverConnector().fetch_jobs(company_input)
            elif portal_input == "ashby":
                raw_jobs = AshbyConnector().fetch_jobs(company_input)
            elif portal_input == "workday":
                raw_jobs = WorkdayCrawler().fetch_jobs(company_input)
            elif portal_input == "linkedin":
                raw_jobs = LinkedinCrawler().search_jobs(keywords=target_role, company=company_input)
            else:
                # Auto fallback across ATS
                for conn in [GreenhouseConnector(), LeverConnector(), AshbyConnector()]:
                    res = conn.fetch_jobs(company_input)
                    if res:
                        raw_jobs = res
                        break

            if raw_jobs:
                matcher = JobMatcher(target_role=target_role, candidate_skills=profile["skills"])
                scored = []
                for j in raw_jobs:
                    score, analysis = matcher.score_job(j, preferred_locations=preferred_locs)
                    job_id = db.add_or_update_job(j, match_score=score)
                    scored.append({
                        "Job ID": job_id,
                        "Score": f"{score}%",
                        "Title": j.get("title"),
                        "Location": j.get("location"),
                        "Portal": j.get("portal"),
                        "Matched Skills": ", ".join(analysis["matched_skills"][:4]),
                        "Apply URL": j.get("apply_url"),
                        "raw_job": j
                    })
                scored.sort(key=lambda x: int(x["Score"].replace("%", "")), reverse=True)
                st.session_state["discovered_jobs"] = scored
                st.success(f"Found and analyzed {len(scored)} active job postings for {company_input}!")
            else:
                st.warning(f"No postings found for '{company_input}' on {portal_input}. Verify company name/slug.")

    # Render Discovered Jobs
    if "discovered_jobs" in st.session_state and st.session_state["discovered_jobs"]:
        st.markdown(f"### Found {len(st.session_state['discovered_jobs'])} Opportunities")

        for item in st.session_state["discovered_jobs"][:10]:
            score_val = int(item["Score"].replace("%", ""))
            badge_color = "#10b981" if score_val >= 70 else ("#f59e0b" if score_val >= 45 else "#6b7280")

            with st.container():
                c_head, c_btn = st.columns([4, 1.5])
                with c_head:
                    st.markdown(f"**[{item['Title']}]({item['Apply URL']})** &nbsp; <span style='background-color:{badge_color}; color:white; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:bold;'>Match: {item['Score']}</span>", unsafe_allow_html=True)
                    st.caption(f"📍 Location: {item['Location']} | Portal: {item['Portal'].upper()} | Skills: {item['Matched Skills'] or 'General match'}")
                with c_btn:
                    if st.button(f"⚡ Open & Autofill", key=f"btn_{item['Job ID']}", use_container_width=True):
                        st.info(f"Opening browser for {item['Title']} in **{exec_mode}**...")
                        try:
                            bm = BrowserManager(headless=False)
                            page = bm.open_url(item["Apply URL"])
                            filler = FormFiller(profile)
                            report = filler.autofill(page)
                            st.success(f"Autofilled {len(report['filled'])} fields! Review in the opened browser.")
                            db.update_status(item["Job ID"], "applied", notes="Autofilled via dashboard")
                        except Exception as e:
                            st.error(f"Autofill notification: {e}")
                st.divider()

# ================= TAB 2: INTERVIEW & SCREENING INTEL =================
with tab2:
    st.subheader(f"🧠 Intelligence Pack for {company_input.title()} ({target_role})")
    
    intel = q_gen.generate_intelligence_pack(
        company_name=company_input or "Tech Company",
        target_role=target_role,
        candidate_profile=profile
    )

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("#### 🏢 Company Context & Culture")
        comp = intel["company"]
        st.write(f"**Domain:** {comp.get('domain')}")
        st.write(f"**Core Values:** {', '.join(comp.get('values', []))}")
        st.info(f"**Known Interview Style:** {comp.get('interview_style')}")

    with c2:
        st.markdown("#### ⭐ Your Resume STAR Highlights")
        for star in intel["resume_star_mapping"]:
            st.markdown(f"**{star['theme']}**")
            st.caption(star["star"])

    st.divider()

    st.markdown("### 🔥 Top Frequently Asked Interview Questions")
    col_tech, col_behav = st.columns(2)

    with col_tech:
        st.markdown("##### 💻 Technical & Architecture Rounds")
        for idx, q in enumerate(intel["interview_questions"]["technical"], 1):
            with st.expander(f"{idx}. {q['question']}"):
                st.markdown(f"**Category:** `{q['category']}`")
                st.markdown(f"**Key Concepts to mention:** {q['key_concepts']}")

    with col_behav:
        st.markdown("##### 🤝 Behavioral & Culture Fit Rounds")
        for idx, q in enumerate(intel["interview_questions"]["behavioral"], 1):
            with st.expander(f"{idx}. {q['question']}"):
                st.markdown(f"**Category:** `{q['category']}`")
                st.markdown(f"**Strategy Tip:** {q['tip']}")

    st.divider()
    st.markdown("### 📝 Application Screening Q&A (Pre-computed for Forms)")
    for qa in intel["screening_qa"]:
        with st.expander(f"Q: {qa['question']}"):
            st.text_area("Answer", value=qa["answer"], height=80, key=f"qa_{qa['question'][:20]}")

# ================= TAB 3: APPLICATION TRACKER =================
with tab3:
    st.subheader("📊 Tracked Applications & Links Ready to Open")
    all_jobs = db.list_jobs()

    if all_jobs:
        df = pd.DataFrame(all_jobs)
        display_df = df[["match_score", "company", "portal", "title", "location", "status", "apply_url", "discovered_at"]]
        display_df.columns = ["Match %", "Company", "Portal", "Title", "Location", "Status", "Apply URL", "Date"]
        st.dataframe(display_df, use_container_width=True)
    else:
        st.info("No applications tracked yet. Run a discovery search in Tab 1 to populate.")
