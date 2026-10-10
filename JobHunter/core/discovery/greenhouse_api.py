import requests
from typing import List, Dict, Any, Optional

class GreenhouseConnector:
    """Connects to Greenhouse Public Board APIs to discover jobs and application requirements."""

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def fetch_jobs(self, company_slug: str) -> List[Dict[str, Any]]:
        """
        Fetches all published jobs from a company's Greenhouse board.
        Example slugs: 'stripe', 'figma', 'gitlab', 'hashicorp'
        """
        slug = company_slug.strip().lower().replace(" ", "")
        url = f"{self.BASE_URL}/{slug}/jobs?content=true"

        try:
            resp = self.session.get(url, timeout=self.timeout)
            if resp.status_code == 404:
                # Try common slug alternatives
                alt_url = f"{self.BASE_URL}/{company_slug.lower()}/jobs?content=true"
                resp = self.session.get(alt_url, timeout=self.timeout)

            if resp.status_code != 200:
                return []

            data = resp.json()
            jobs = data.get("jobs", [])
            results = []
            for j in jobs:
                loc = j.get("location", {}).get("name", "Unknown")
                offices = [o.get("name") for o in j.get("offices", []) if o.get("name")]
                if offices:
                    loc = ", ".join(offices)

                results.append({
                    "portal": "greenhouse",
                    "company": company_slug,
                    "id": str(j.get("id")),
                    "title": j.get("title", ""),
                    "location": loc,
                    "apply_url": j.get("absolute_url", ""),
                    "updated_at": j.get("updated_at", ""),
                    "content": j.get("content", ""), # HTML or text description
                    "departments": [d.get("name") for d in j.get("departments", [])]
                })
            return results
        except Exception as e:
            print(f"[GreenhouseConnector] Error querying {company_slug}: {e}")
            return []

    def fetch_job_questions(self, company_slug: str, job_id: str) -> List[Dict[str, Any]]:
        """
        Fetches specific custom application questions for a job.
        Endpoint: /v1/boards/{board_token}/jobs/{job_id}
        """
        slug = company_slug.strip().lower().replace(" ", "")
        url = f"{self.BASE_URL}/{slug}/jobs/{job_id}?questions=true"
        try:
            resp = self.session.get(url, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("questions", [])
            return []
        except Exception as e:
            print(f"[GreenhouseConnector] Error fetching questions for {job_id}: {e}")
            return []
