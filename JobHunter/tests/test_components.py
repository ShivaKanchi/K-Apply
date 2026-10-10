import unittest
import os
import shutil
from pathlib import Path

from core.profile.resume_parser import ResumeParser
from core.profile.profile_manager import ProfileManager
from core.intelligence.company_research import CompanyResearcher
from core.intelligence.question_generator import QuestionGenerator
from core.discovery.matcher import JobMatcher
from core.discovery.greenhouse_api import GreenhouseConnector
from core.discovery.lever_api import LeverConnector
from core.discovery.ashby_api import AshbyConnector
from core.tracker.db import JobTrackerDB

class TestJobHunterComponents(unittest.TestCase):

    def setUp(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.test_dir = base_dir / "data" / "test_run"
        self.test_dir.mkdir(parents=True, exist_ok=True)
        self.sample_resume = str(base_dir / "data" / "sample_resume.md")

    def tearDown(self):
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_resume_parser(self):
        parser = ResumeParser(self.sample_resume)
        data = parser.parse()
        self.assertIn("contact", data)
        self.assertEqual(data["contact"]["email"], "alex.morgan@example.com")
        self.assertTrue(len(data["skills"]) > 5)
        self.assertIn("python", data["skills"])
        self.assertIn("typescript", data["skills"])

    def test_profile_manager(self):
        mgr = ProfileManager(resume_path=self.sample_resume)
        profile = mgr.get_consolidated_profile(target_role="Full Stack Engineer")
        self.assertEqual(profile["role_focus"], "Full Stack Engineer")
        self.assertEqual(profile["personal"]["email"], "alex.morgan@example.com")
        self.assertTrue(len(profile["skills"]) > 0)

    def test_company_research_and_question_generator(self):
        q_gen = QuestionGenerator()
        profile_mgr = ProfileManager(resume_path=self.sample_resume)
        profile = profile_mgr.get_consolidated_profile()

        intel = q_gen.generate_intelligence_pack("stripe", "Full Stack Engineer", profile)
        self.assertEqual(intel["company"]["name"], "Stripe")
        self.assertTrue(len(intel["screening_qa"]) >= 4)
        self.assertTrue(len(intel["interview_questions"]["technical"]) >= 2)
        self.assertTrue(len(intel["interview_questions"]["behavioral"]) >= 2)
        self.assertTrue(len(intel["resume_star_mapping"]) > 0)

    def test_job_matcher(self):
        matcher = JobMatcher(target_role="Full Stack Engineer", candidate_skills=["python", "react", "postgresql"])
        sample_job = {
            "title": "Senior Full Stack Engineer",
            "content": "Looking for a Full Stack Engineer experienced with Python, React, and PostgreSQL in our cloud team.",
            "location": "Remote - US"
        }
        score, analysis = matcher.score_job(sample_job, preferred_locations=["Remote"])
        self.assertGreaterEqual(score, 70)
        self.assertTrue(analysis["recommended"])
        self.assertIn("python", analysis["matched_skills"])

    def test_job_tracker_db(self):
        test_db_path = str(self.test_dir / "test_tracker.db")
        db = JobTrackerDB(db_path=test_db_path)
        job = {
            "portal": "greenhouse",
            "company": "stripe",
            "id": "12345",
            "title": "Software Engineer - Payments",
            "location": "Remote",
            "apply_url": "https://boards.greenhouse.io/stripe/jobs/12345"
        }
        job_id = db.add_or_update_job(job, match_score=85)
        jobs = db.list_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]["match_score"], 85)
        self.assertEqual(jobs[0]["status"], "ready_to_apply")

        # Update status
        db.update_status(job_id, "applied", notes="Test applied")
        applied_jobs = db.list_jobs(status="applied")
        self.assertEqual(len(applied_jobs), 1)

if __name__ == "__main__":
    unittest.main()
