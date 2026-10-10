import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from .resume_parser import ResumeParser

class ProfileManager:
    """Consolidates resume data, user profile defaults, and target role configuration."""

    def __init__(self, user_profile_path: str = "config/user_profile.yaml", resume_path: Optional[str] = None):
        self.profile_path = Path(user_profile_path)
        self.profile_data = self._load_profile_yaml()
        self.resume_data = {}
        self.resume_path = resume_path
        
        if resume_path:
            self.load_resume(resume_path)

    def _load_profile_yaml(self) -> Dict[str, Any]:
        target_path = self.profile_path
        if not target_path.exists():
            pkg_fallback = Path(__file__).resolve().parent.parent.parent / self.profile_path
            if pkg_fallback.exists():
                target_path = pkg_fallback
        if target_path.exists():
            with open(target_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        return {}

    def load_resume(self, resume_path: str):
        self.resume_path = resume_path
        parser = ResumeParser(resume_path)
        self.resume_data = parser.parse()

    def get_consolidated_profile(self, target_role: Optional[str] = None) -> Dict[str, Any]:
        personal = self.profile_data.get("personal_info", {})
        social = self.profile_data.get("social_profiles", {})
        prefs = self.profile_data.get("preferences", {})
        eeoc = self.profile_data.get("demographics_eeoc", {})

        # Contact priority: resume contact if present, else config
        resume_contact = self.resume_data.get("contact", {})
        email = resume_contact.get("email") or personal.get("email", "")
        phone = resume_contact.get("phone") or personal.get("phone", "")
        linkedin = resume_contact.get("linkedin") or social.get("linkedin", "")
        github = resume_contact.get("github") or social.get("github", "")

        active_role = target_role or (prefs.get("target_roles", ["Full Stack Engineer"])[0])

        return {
            "personal": {
                "first_name": personal.get("first_name", ""),
                "last_name": personal.get("last_name", ""),
                "full_name": personal.get("full_name", f"{personal.get('first_name', '')} {personal.get('last_name', '')}".strip()),
                "email": email,
                "phone": phone,
                "address": personal.get("address", {}),
            },
            "social": {
                "linkedin": linkedin,
                "github": github,
                "portfolio": social.get("portfolio", ""),
            },
            "role_focus": active_role,
            "skills": self.resume_data.get("skills", []),
            "resume_path": self.resume_path,
            "resume_text": self.resume_data.get("raw_text", ""),
            "work_authorization": prefs.get("work_authorization", {}),
            "salary_expectation": prefs.get("desired_salary", ""),
            "notice_period_weeks": prefs.get("notice_period_weeks", 2),
            "eeoc": eeoc
        }
