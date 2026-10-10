import re
from typing import Dict, Any, List, Tuple

class JobMatcher:
    """Evaluates relevance between a job posting and candidate profile/target role."""

    def __init__(self, target_role: str = "Full Stack Engineer", candidate_skills: List[str] = None):
        self.target_role = target_role.strip().lower()
        self.candidate_skills = [s.lower() for s in (candidate_skills or [])]

    def score_job(self, job: Dict[str, Any], preferred_locations: List[str] = None) -> Tuple[int, Dict[str, Any]]:
        """
        Returns a score (0 - 100) and analysis dictionary.
        """
        title = job.get("title", "").lower()
        content = (job.get("content", "") or job.get("description", "")).lower()
        location = job.get("location", "").lower()

        score = 0
        reasons = []

        # 1. Title alignment (Max 45 points)
        role_tokens = self.target_role.split()
        matched_tokens = [t for t in role_tokens if t in title]
        if title == self.target_role:
            score += 45
            reasons.append(f"Exact title match: '{job.get('title')}'")
        elif len(matched_tokens) == len(role_tokens):
            score += 40
            reasons.append(f"All role keywords found in title")
        elif len(matched_tokens) > 0:
            token_pts = int(35 * (len(matched_tokens) / len(role_tokens)))
            score += token_pts
            reasons.append(f"Partial title match: {matched_tokens}")
        else:
            # Check for synonyms
            synonyms = {
                "full stack": ["software engineer", "fullstack", "web developer", "platform engineer"],
                "ai": ["machine learning", "ml", "nlp", "llm", "deep learning"],
                "backend": ["software engineer", "server", "distributed systems", "api"],
                "frontend": ["web", "ui", "react", "client"]
            }
            found_syn = False
            for key, syn_list in synonyms.items():
                if key in self.target_role:
                    for syn in syn_list:
                        if syn in title:
                            score += 25
                            reasons.append(f"Title synonym matched '{syn}'")
                            found_syn = True
                            break
                    if found_syn:
                        break

        # 2. Skill alignment (Max 35 points)
        matched_skills = []
        missing_skills = []
        if self.candidate_skills:
            for skill in self.candidate_skills:
                # Look for skill in job content or title
                if re.search(rf"\b{re.escape(skill)}\b", content) or re.search(rf"\b{re.escape(skill)}\b", title):
                    matched_skills.append(skill)
                else:
                    missing_skills.append(skill)

            skill_ratio = len(matched_skills) / max(len(self.candidate_skills), 1)
            skill_score = min(35, int(skill_ratio * 40))
            score += skill_score
            reasons.append(f"Matched {len(matched_skills)} candidate skills: {', '.join(matched_skills[:6])}")

        # 3. Location alignment (Max 20 points)
        loc_score = 10 # baseline
        if preferred_locations:
            pref_locs_lower = [l.lower() for l in preferred_locations]
            if any(l in location for l in pref_locs_lower):
                loc_score = 20
                reasons.append(f"Location preferred: '{job.get('location')}'")
            elif "remote" in location and any("remote" in l for l in pref_locs_lower):
                loc_score = 20
                reasons.append("Remote location matched")
        score += loc_score

        # Cap score between 0 and 100
        final_score = max(0, min(100, score))

        analysis = {
            "score": final_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills[:8],
            "reasons": reasons,
            "recommended": final_score >= 60
        }
        return final_score, analysis
