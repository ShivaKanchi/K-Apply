import requests
from typing import List, Dict, Any

class LeverConnector:
    """Connects to Lever Postings API to discover jobs and requirements."""

    BASE_URL = "https://api.lever.co/v0/postings"

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def fetch_jobs(self, company_slug: str) -> List[Dict[str, Any]]:
        """
        Fetches all published jobs from a company's Lever board.
        Example slugs: 'netflix', 'spotify', 'palantir'
        """
        slug = company_slug.strip().lower().replace(" ", "")
        url = f"{self.BASE_URL}/{slug}?mode=json"

        try:
            resp = self.session.get(url, timeout=self.timeout)
            if resp.status_code != 200:
                return []

            postings = resp.json()
            if not isinstance(postings, list):
                return []

            results = []
            for p in postings:
                categories = p.get("categories", {})
                results.append({
                    "portal": "lever",
                    "company": company_slug,
                    "id": p.get("id", ""),
                    "title": p.get("text", ""),
                    "location": categories.get("location", "Remote/Unspecified"),
                    "team": categories.get("team", ""),
                    "commitment": categories.get("commitment", ""), # Full time, etc.
                    "apply_url": p.get("applyUrl", p.get("hostedUrl", "")),
                    "description": p.get("descriptionPlain", "") or p.get("description", ""),
                    "created_at": p.get("createdAt", "")
                })
            return results
        except Exception as e:
            print(f"[LeverConnector] Error querying {company_slug}: {e}")
            return []
