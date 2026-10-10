import time
from typing import Dict, Any

class SubmissionController:
    """Controls execution flow: Human-in-the-Loop review pause vs fully automated submission."""

    def __init__(self, mode: str = "review"):
        self.mode = mode.lower().strip() # "review" or "auto"

    def handle_submission(self, page, fill_report: Dict[str, Any], job_title: str) -> Dict[str, Any]:
        """
        Executes submission logic according to the selected mode.
        """
        if self.mode == "review":
            return self._execute_hitl_review(page, fill_report, job_title)
        elif self.mode == "auto":
            return self._execute_auto_submit(page, fill_report, job_title)
        else:
            return {"status": "error", "message": f"Unknown mode: {self.mode}"}

    def _execute_hitl_review(self, page, fill_report: Dict[str, Any], job_title: str) -> Dict[str, Any]:
        """
        Human-in-the-loop: Keeps browser open for candidate review and manual submit.
        """
        print("\n" + "=" * 60)
        print(f"👀 [HITL REVIEW READY] Application pre-filled for: {job_title}")
        print(f"✅ Fields Populated: {', '.join(fill_report.get('filled', []))}")
        if fill_report.get("failed"):
            print(f"⚠️ Notices: {', '.join(fill_report.get('failed', []))}")
        print("💡 The browser window is open. Please verify inputs, solve any CAPTCHA if prompted, and click 'Submit Application'.")
        print("=" * 60 + "\n")

        return {
            "status": "pending_user_submission",
            "mode": "review",
            "message": "Form autofilled. Browser is awaiting your final review and submission."
        }

    def _execute_auto_submit(self, page, fill_report: Dict[str, Any], job_title: str) -> Dict[str, Any]:
        """
        Automated submission: Checks for CAPTCHA, finds submit button, and clicks.
        """
        # 1. Simple CAPTCHA safety check
        captcha_check = page.locator("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], div.cf-turnstile")
        if captcha_check.count() > 0:
            print("⚠️ CAPTCHA detected on page. Pausing for human solver...")
            return self._execute_hitl_review(page, fill_report, job_title)

        # 2. Look for submit button
        submit_selectors = [
            "button[type='submit']", "input[type='submit']",
            "button:has-text('Submit Application')", "button:has-text('Submit')",
            "button:has-text('Apply Now')"
        ]
        for sel in submit_selectors:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                try:
                    btn.click()
                    page.wait_for_timeout(3000)
                    return {
                        "status": "submitted",
                        "mode": "auto",
                        "message": f"Application for '{job_title}' submitted automatically."
                    }
                except Exception as e:
                    return {
                        "status": "failed",
                        "mode": "auto",
                        "message": f"Failed to click submit button: {e}"
                    }

        return {
            "status": "failed",
            "mode": "auto",
            "message": "Submit button not found on page."
        }
