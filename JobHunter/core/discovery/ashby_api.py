import requests
from typing import List, Dict, Any

class AshbyConnector:
    """Connects to Ashby Job Board API used by leading modern tech companies and AI startups."""

    BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def fetch_jobs(self, company_slug: str) -> List[Dict[str, Any]]:
        """
        Fetches jobs from Ashby API.
        Example slugs: 'notion', 'ramp', 'retool', 'openai'
        """
        slug = company_slug.strip().lower().replace(" ", "")
        url = f"{self.BASE_URL}/{slug}"

        try:
            resp = self.session.get(url, timeout=self.timeout)
            if resp.status_code != 200:
                return []

            data = resp.json()
            jobs = data.get("jobs", [])
            results = []
            for j in jobs:
                results.append({
                    "portal": "ashby",
                    "company": company_slug,
                    "id": j.get("id", ""),
                    "title": j.get("title", ""),
                    "location": j.get("location", "Remote/Unspecified"),
                    "department": j.get("department", ""),
                    "employment_type": j.get("employmentType", ""),
                    "apply_url": j.get("jobUrl", f"https://jobs.ashbyhq.com/{slug}/{j.get('id')}"),
                    "published_at": j.get("publishedAt", "")
                })
            return results
        except Exception as e:
            print(f"[AshbyConnector] Error querying {company_slug}: {e}")
            return []
