# 🎯 K-Apply Hunter (Autonomous Automation Module)

Autonomous Job Discovery, Screening & Interview Intelligence, and Background Autofill Engine for the **K-Apply Suite**.

K-Apply Hunter solves the repetitive overhead of job hunting by:
1. **Targeted Job Discovery**: Searching specific company boards across public ATS APIs (Greenhouse, Lever, Ashby) and crawlers (Workday, LinkedIn).
2. **Company & Role Question Intelligence**: Predicting company screening questions, pre-computing answers tailored to your resume, and curating the top technical/behavioral interview questions.
3. **Smart Autofill & Ready Links**: Keeping direct apply links ready, autofilling forms via Playwright, and supporting a toggleable **Human-in-the-Loop (HITL)** review mode or full auto-submit.
4. **Multi-Role Adaptability**: Adapts to any role at runtime (Full Stack, Backend, AI/ML, DevOps, etc.) and dynamically re-scores job matches against your resume.

---

## 🚀 Quick Start

### 1. Installation
```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. Run the Interactive Web Dashboard
```bash
streamlit run ui/app.py
```
- Upload your resume (or use the built-in profile).
- Enter target company (e.g. `stripe`, `figma`, `gitlab`, `notion`) and portal.
- View match scores, read predicted interview questions, and click **⚡ Open & Autofill**.

---

## 💻 CLI Commands

### 1. Discover Jobs & Predict Questions (`hunt`)
```bash
# Discover jobs at Stripe on Greenhouse and generate interview prep questions
python cli.py hunt --company stripe --portal greenhouse --role "Full Stack Engineer"

# Search with runtime custom resume in auto-fill mode
python cli.py hunt --company figma --portal greenhouse --role "Full Stack Engineer" --resume path/to/my_resume.pdf --autofill
```

### 2. Standalone Company Interview Intelligence (`intel`)
```bash
# Generate the top 15+ technical & behavioral interview questions and tailored screening answers
python cli.py intel --company stripe --role "Full Stack Engineer"
python cli.py intel --company amazon --role "Software Engineer"
```

### 3. List Saved Jobs & Ready Apply Links (`list`)
```bash
python cli.py list
python cli.py list --status ready_to_apply --min-score 70
```

### 4. Direct Autofill for Any Job URL (`apply`)
```bash
# Open and autofill an application link in Review mode (HITL)
python cli.py apply --url "https://boards.greenhouse.io/stripe/jobs/12345" --role "Full Stack Engineer" --mode review
```

---

## ⚙️ Configuration & Customization

- **`config/settings.yaml`**: Default roles, locations, minimum match threshold, and browser pacing.
- **`config/user_profile.yaml`**: Baseline personal details, contact info, social links, salary expectations, notice period, and work authorization.
- **`data/sample_resume.md`**: Pre-loaded candidate resume.
