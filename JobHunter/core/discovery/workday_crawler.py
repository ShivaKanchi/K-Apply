import requests
from typing import List, Dict, Any

class WorkdayCrawler:
    """
    Discovers jobs from modern Workday career sites using their public CXS search API.
    Example: https://{subdomain}.myworkdayjobs.com/wday/cxs/{subdomain}/{tenant}/jobs
    """

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/json"
        })

    def fetch_jobs(self, company_subdomain: str, tenant: str = "External", search_text: str = "") -> List[Dict[str, Any]]:
        """
        Queries the Workday CXS JSON endpoint.
        Example: company_subdomain='salesforce', tenant='External_Career_Site'
        """
        url = f"https://{company_subdomain}.myworkdayjobs.com/wday/cxs/{company_subdomain}/{tenant}/jobs"
        payload = {
            "appliedFacets": {},
            "limit": 20,
            "offset": 0,
            "searchText": search_text
        }

        try:
            resp = self.session.post(url, json=payload, timeout=self.timeout)
            if resp.status_code != 200:
                return []

            data = resp.json()
            postings = data.get("jobPostings", [])
            results = []
            for p in postings:
                job_path = p.get("externalPath", "")
                apply_url = f"https://{company_subdomain}.myworkdayjobs.com/en-US/{tenant}/job/{job_path.lstrip('/')}"
                results.append({
                    "portal": "workday",
                    "company": company_subdomain,
                    "id": p.get("bulletFields", [p.get("title", "")])[0],
                    "title": p.get("title", ""),
                    "location": p.get("locationsText", "Unspecified"),
                    "apply_url": apply_url,
                    "posted_on": p.get("postedOn", "")
                })
            return results
        except Exception as e:
            print(f"[WorkdayCrawler] Error querying {company_subdomain}: {e}")
            return []
