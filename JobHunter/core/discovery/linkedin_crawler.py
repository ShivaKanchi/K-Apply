import re
import requests
from typing import List, Dict, Any

class LinkedinCrawler:
    """
    Searches public job listings on LinkedIn using the public guest search endpoint.
    Avoids bot flags and account restrictions because it does not require personal credentials.
    """

    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        })

    def search_jobs(self, keywords: str, location: str = "United States", company: str = "") -> List[Dict[str, Any]]:
        query_terms = f"{keywords} {company}".strip()
        params = {
            "keywords": query_terms,
            "location": location,
            "start": 0
        }

        try:
            resp = self.session.get(self.BASE_URL, params=params, timeout=self.timeout)
            if resp.status_code != 200:
                return []

            html = resp.text
            # Extract job cards using regex
            job_pattern = re.compile(
                r'<a[^>]+class="base-card__full-link[^"]*"[^>]+href="(?P<url>[^"?]+)[^"]*"[^>]*>.*?<span class="sr-only">(?P<title>[^<]+)</span>',
                re.DOTALL
            )
            comp_pattern = re.compile(r'<h4[^>]+class="base-search-card__subtitle"[^>]*>\s*<a[^>]*>(?P<comp>[^<]+)</a>', re.DOTALL)
            loc_pattern = re.compile(r'<span[^>]+class="job-search-card__location"[^>]*>(?P<loc>[^<]+)</span>', re.DOTALL)

            matches = list(job_pattern.finditer(html))
            comp_matches = list(comp_pattern.finditer(html))
            loc_matches = list(loc_pattern.finditer(html))

            results = []
            for i, m in enumerate(matches[:15]):
                comp_name = comp_matches[i].group("comp").strip() if i < len(comp_matches) else company
                loc_name = loc_matches[i].group("loc").strip() if i < len(loc_matches) else location

                results.append({
                    "portal": "linkedin",
                    "company": comp_name,
                    "title": m.group("title").strip(),
                    "location": loc_name,
                    "apply_url": m.group("url"),
                    "id": f"li_{i}"
                })
            return results
        except Exception as e:
            print(f"[LinkedinCrawler] Error searching LinkedIn: {e}")
            return []
