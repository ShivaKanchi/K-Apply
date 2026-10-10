import os
import sys
import argparse
from typing import Optional, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

from core.profile.profile_manager import ProfileManager
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

console = Console()

def get_job_connector(portal: str):
    p = portal.lower().strip()
    if p == "greenhouse":
        return GreenhouseConnector()
    elif p == "lever":
        return LeverConnector()
    elif p == "ashby":
        return AshbyConnector()
    elif p == "workday":
        return WorkdayCrawler()
    elif p == "linkedin":
        return LinkedinCrawler()
    return None

def hunt_command(args):
    """Discovers jobs, generates question intelligence, and prepares apply links."""
    console.print(Panel.fit(f"[bold cyan]🎯 K-Apply Hunter Discovery Engine[/bold cyan]\nTarget Company: [green]{args.company}[/green] | Portal: [yellow]{args.portal}[/yellow] | Role: [magenta]{args.role}[/magenta]"))

    # 1. Profile and Resume Ingestion
    resume_path = args.resume or "data/sample_resume.md"
    profile_mgr = ProfileManager(resume_path=resume_path)
    profile = profile_mgr.get_consolidated_profile(target_role=args.role)

    console.print(f"[dim]Loaded Candidate Profile:[/dim] [bold]{profile['personal']['full_name']}[/bold] ({len(profile['skills'])} skills indexed from {os.path.basename(resume_path)})")

    # 2. Company & Interview Intelligence
    q_gen = QuestionGenerator()
    intel_pack = q_gen.generate_intelligence_pack(
        company_name=args.company,
        target_role=args.role,
        candidate_profile=profile
    )

    console.print(f"\n[bold green]📋 Intelligence Pack Ready for {args.company}:[/bold green]")
    comp_info = intel_pack["company"]
    console.print(f"• [bold]Domain:[/bold] {comp_info.get('domain')}")
    console.print(f"• [bold]Core Values:[/bold] {', '.join(comp_info.get('values', []))}")
    console.print(f"• [bold]Known Interview Style:[/bold] {comp_info.get('interview_style')}")

    # Display Top Interview Questions
    console.print("\n[bold yellow]🔥 Top Frequently Asked Interview Questions for this Role:[/bold yellow]")
    for idx, q in enumerate(intel_pack["interview_questions"]["technical"][:2], 1):
        console.print(f"  [cyan]{idx}. (Technical)[/cyan] {q['question']}")
        console.print(f"     [dim]Key Concepts: {q['key_concepts']}[/dim]")
    for idx, q in enumerate(intel_pack["interview_questions"]["behavioral"][:2], 3):
        console.print(f"  [cyan]{idx}. (Behavioral)[/cyan] {q['question']}")
        console.print(f"     [dim]Strategy: {q['tip']}[/dim]")

    # 3. Job Search & Scraping
    connector = get_job_connector(args.portal)
    raw_jobs = []

    with console.status(f"[bold green]Searching {args.portal.upper()} for openings at {args.company}..."):
        if args.portal == "linkedin":
            raw_jobs = connector.search_jobs(keywords=args.role, company=args.company)
        elif connector:
            raw_jobs = connector.fetch_jobs(company_slug=args.company)
        else:
            # Multi-portal fallback
            for p_name, conn_cls in [("greenhouse", GreenhouseConnector), ("lever", LeverConnector), ("ashby", AshbyConnector)]:
                try:
                    res = conn_cls().fetch_jobs(args.company)
                    if res:
                        raw_jobs.extend(res)
                        break
                except Exception:
                    continue

    if not raw_jobs:
        if getattr(args, "json", False):
            import json
            print(json.dumps({"intel": intel_pack, "jobs": []}))
            return
        console.print(f"[red]No active jobs found for '{args.company}' on portal '{args.portal}'.[/red]")
        console.print("[dim]Tip: Check the company slug spelling (e.g., 'stripe', 'figma', 'gitlab', 'netflix').[/dim]")
        return

    # 4. Matching & Scoring
    matcher = JobMatcher(target_role=args.role, candidate_skills=profile["skills"])
    db = JobTrackerDB()
    scored_jobs = []

    for job in raw_jobs:
        score, analysis = matcher.score_job(job)
        job_id = db.add_or_update_job(job, match_score=score)
        scored_jobs.append((score, job, analysis, job_id))

    scored_jobs.sort(key=lambda x: x[0], reverse=True)

    if getattr(args, "json", False):
        import json
        print(json.dumps({
            "intel": intel_pack,
            "jobs": [{
                "id": str(job_id),
                "title": job.get("title", ""),
                "company": args.company,
                "portal": job.get("portal", args.portal),
                "location": job.get("location", "Remote"),
                "apply_url": job.get("apply_url", ""),
                "matchScore": score,
                "matchedSkills": analysis.get("matched_skills", []),
                "missingSkills": analysis.get("missing_skills", [])
            } for score, job, analysis, job_id in scored_jobs]
        }))
        return

    # 5. Output Table of Matched Jobs
    table = Table(title=f"Discovered Job Listings for {args.company} (Ranked by Match Score)")
    table.add_column("Score", justify="center", style="bold")
    table.add_column("Title", style="cyan")
    table.add_column("Location", style="dim")
    table.add_column("Matched Skills", style="green")
    table.add_column("Apply Link", style="blue")

    for score, job, analysis, job_id in scored_jobs[:8]:
        score_color = "green" if score >= 70 else ("yellow" if score >= 45 else "red")
        matched_str = ", ".join(analysis["matched_skills"][:3]) or "General match"
        table.add_row(
            f"[{score_color}]{score}%[/{score_color}]",
            job["title"],
            job["location"][:25],
            matched_str,
            job["apply_url"]
        )

    console.print(table)
    console.print(f"[dim]All {len(scored_jobs)} jobs have been saved to local tracking database (data/job_hunter.db).[/dim]")

    # 6. Optional Auto-fill Trigger
    if args.autofill and scored_jobs:
        top_job = scored_jobs[0][1]
        console.print(f"\n[bold cyan]🚀 Launching Autofill Engine for top match:[/bold cyan] {top_job['title']}")
        execute_autofill(top_job["apply_url"], profile, args.mode, top_job["title"])

def execute_autofill(url: str, profile: dict, mode: str, job_title: str):
    """Launches Playwright browser to autofill form and handle HITL review or auto-submit."""
    browser_mgr = BrowserManager(headless=False)
    submission_ctrl = SubmissionController(mode=mode)
    filler = FormFiller(profile_data=profile)

    try:
        console.print(f"[green]Opening apply link in browser:[/green] {url}")
        page = browser_mgr.open_url(url)
        console.print("[dim]Scanning page fields and auto-filling...[/dim]")
        
        report = filler.autofill(page)
        console.print(f"[bold green]Populated {len(report['filled'])} elements successfully.[/bold green]")
        for item in report["filled"]:
            console.print(f"  • {item}")

        result = submission_ctrl.handle_submission(page, report, job_title)
        
        if mode == "review":
            input("\n👉 Press [Enter] in this terminal when you have reviewed and finished submitting... ")

    except Exception as e:
        console.print(f"[red]Autofill execution notice: {e}[/red]")
    finally:
        browser_mgr.close()

def intel_command(args):
    """Generates standalone company prep pack & screening answers."""
    resume_path = args.resume or "data/sample_resume.md"
    profile_mgr = ProfileManager(resume_path=resume_path)
    profile = profile_mgr.get_consolidated_profile(target_role=args.role)

    q_gen = QuestionGenerator()
    pack = q_gen.generate_intelligence_pack(args.company, args.role, profile)

    if getattr(args, "json", False):
        import json
        print(json.dumps(pack))
        return

    console.print(Panel.fit(f"[bold cyan]🎯 Intelligence & Prep Pack for {args.company}[/bold cyan]\nTarget Role: [magenta]{args.role}[/magenta]"))

    console.print("\n[bold green]📝 Ready-to-use Screening Answers (Matched to your Resume):[/bold green]")
    for item in pack["screening_qa"]:
        console.print(f"\n[bold yellow]Q: {item['question']}[/bold yellow]")
        console.print(f"[cyan]A:[/cyan] {item['answer']}")

    console.print("\n[bold green]💡 Top Most Asked Interview Questions:[/bold green]")
    for idx, q in enumerate(pack["interview_questions"]["technical"], 1):
        console.print(f"  {idx}. [bold]{q['question']}[/bold] ({q['category']})")
    for idx, q in enumerate(pack["interview_questions"]["behavioral"], len(pack["interview_questions"]["technical"]) + 1):
        console.print(f"  {idx}. [bold]{q['question']}[/bold] ({q['category']})")

    console.print("\n[bold green]⭐ STAR Experience Bullet Points from your Resume:[/bold green]")
    for star in pack["resume_star_mapping"]:
        console.print(f"  • [bold]{star['theme']}:[/bold] {star['star']}")

def list_command(args):
    """Lists saved jobs from the tracker."""
    db = JobTrackerDB()
    jobs = db.list_jobs(status=args.status, min_score=args.min_score)

    table = Table(title=f"Saved Jobs in Tracker ({len(jobs)} total)")
    table.add_column("Score", justify="center")
    table.add_column("Company", style="cyan")
    table.add_column("Portal", style="dim")
    table.add_column("Title")
    table.add_column("Status", style="yellow")
    table.add_column("Apply Link", style="blue")

    for j in jobs:
        table.add_row(
            f"{j['match_score']}%",
            j['company'],
            j['portal'],
            j['title'][:30],
            j['status'],
            j['apply_url']
        )
    console.print(table)

def main():
    parser = argparse.ArgumentParser(description="K-Apply Hunter - Autonomous Job Discovery, Intelligence & Autofill Engine")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Hunt command
    hunt_parser = subparsers.add_parser("hunt", help="Search jobs, predict questions, and keep links ready to autofill")
    hunt_parser.add_argument("--company", required=True, help="Target company name or slug (e.g. stripe, figma, gitlab, netflix)")
    hunt_parser.add_argument("--portal", default="greenhouse", choices=["greenhouse", "lever", "ashby", "workday", "linkedin", "auto"], help="Target job portal or ATS")
    hunt_parser.add_argument("--role", default="Full Stack Engineer", help="Target job role (defaults to Full Stack Engineer, adaptable to any role)")
    hunt_parser.add_argument("--resume", default="data/sample_resume.md", help="Path to resume file (PDF, DOCX, Markdown)")
    hunt_parser.add_argument("--mode", default="review", choices=["review", "auto"], help="Execution mode: review (HITL pause) or auto (full automated submit)")
    hunt_parser.add_argument("--autofill", action="store_true", help="Automatically launch browser and pre-fill top matched job")
    hunt_parser.add_argument("--json", action="store_true", help="Output results as JSON")

    # Intel command
    intel_parser = subparsers.add_parser("intel", help="Generate company interview questions & tailored screening answers")
    intel_parser.add_argument("--company", required=True, help="Target company name")
    intel_parser.add_argument("--role", default="Full Stack Engineer", help="Target job role")
    intel_parser.add_argument("--resume", default="data/sample_resume.md", help="Path to resume file")
    intel_parser.add_argument("--json", action="store_true", help="Output result as JSON")

    # List command
    list_parser = subparsers.add_parser("list", help="List discovered jobs from tracking database")
    list_parser.add_argument("--status", choices=["ready_to_apply", "applied", "skipped"], default=None, help="Filter by status")
    list_parser.add_argument("--min-score", type=int, default=0, help="Minimum match score filter")

    # Apply command
    apply_parser = subparsers.add_parser("apply", help="Open and autofill a specific job application link")
    apply_parser.add_argument("--url", required=True, help="Job apply URL")
    apply_parser.add_argument("--role", default="Full Stack Engineer", help="Job role")
    apply_parser.add_argument("--resume", default="data/sample_resume.md", help="Path to resume file")
    apply_parser.add_argument("--mode", default="review", choices=["review", "auto"], help="Execution mode")

    args = parser.parse_args()

    if args.command == "hunt":
        hunt_command(args)
    elif args.command == "intel":
        intel_command(args)
    elif args.command == "list":
        list_command(args)
    elif args.command == "apply":
        profile_mgr = ProfileManager(resume_path=args.resume)
        profile = profile_mgr.get_consolidated_profile(target_role=args.role)
        execute_autofill(args.url, profile, args.mode, args.role)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
