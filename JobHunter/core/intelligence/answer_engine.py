import re
from typing import Dict, Any

class AnswerEngine:
    """Answers dynamic custom ATS form fields using semantic keyword matching and profile context."""

    def __init__(self, profile_data: Dict[str, Any]):
        self.profile = profile_data
        self.personal = profile_data.get("personal", {})
        self.social = profile_data.get("social", {})
        self.auth = profile_data.get("work_authorization", {})
        self.eeoc = profile_data.get("eeoc", {})
        self.skills = profile_data.get("skills", [])
        self.resume_text = profile_data.get("resume_text", "")

    def answer_question(self, label: str, field_type: str = "text") -> str:
        """
        Determines the optimal response for a form input label.
        Handles personal info, social links, authorization, salary, experience, and custom open-ended questions.
        """
        norm_label = label.lower().strip()

        # 1. Names
        if any(k in norm_label for k in ["first name", "given name"]):
            return self.personal.get("first_name", "")
        if any(k in norm_label for k in ["last name", "family name", "surname"]):
            return self.personal.get("last_name", "")
        if any(k in norm_label for k in ["full name", "your name"]):
            return self.personal.get("full_name", "")

        # 2. Contact details
        if "email" in norm_label:
            return self.personal.get("email", "")
        if any(k in norm_label for k in ["phone", "mobile", "contact number"]):
            return self.personal.get("phone", "")

        # 3. Address & Location
        addr = self.personal.get("address", {})
        if "city" in norm_label:
            return addr.get("city", "")
        if "state" in norm_label or "province" in norm_label:
            return addr.get("state", "")
        if "zip" in norm_label or "postal" in norm_label:
            return addr.get("postal_code", "")
        if "country" in norm_label:
            return addr.get("country", "")

        # 4. Social profiles
        if "linkedin" in norm_label:
            return self.social.get("linkedin", "")
        if "github" in norm_label:
            return self.social.get("github", "")
        if any(k in norm_label for k in ["portfolio", "website", "personal site"]):
            return self.social.get("portfolio", "")

        # 5. Work Authorization & Sponsorship
        if any(k in norm_label for k in ["authorized to work", "legal right to work", "legally eligible"]):
            return "Yes" if self.auth.get("authorized_to_work", True) else "No"
        if any(k in norm_label for k in ["sponsorship", "require visa", "require sponsorship"]):
            return "Yes" if self.auth.get("requires_sponsorship", False) else "No"

        # 6. Notice period & Availability
        if any(k in norm_label for k in ["notice period", "how soon can you start", "availability"]):
            return f"{self.profile.get('notice_period_weeks', 2)} weeks"

        # 7. Salary expectations
        if any(k in norm_label for k in ["salary", "compensation", "desired pay"]):
            return self.profile.get("salary_expectation", "$140,000 - $175,000 USD")

        # 8. Years of experience
        if any(k in norm_label for k in ["years of experience", "total experience"]):
            return "5+"

        # 9. EEOC / Diversity
        if "gender" in norm_label:
            return self.eeoc.get("gender", "Decline to Self-Identify")
        if any(k in norm_label for k in ["race", "ethnicity"]):
            return self.eeoc.get("race_ethnicity", "Decline to Self-Identify")
        if "veteran" in norm_label:
            return self.eeoc.get("veteran_status", "I am not a protected veteran")
        if "disability" in norm_label:
            return self.eeoc.get("disability_status", "No, I do not have a disability")

        # 10. Open-ended "Why us?" or "Cover Letter"
        if any(k in norm_label for k in ["why do you want", "why us", "cover letter", "note to hiring manager"]):
            role = self.profile.get("role_focus", "Full Stack Engineer")
            top_skills = ", ".join(self.skills[:4]) if self.skills else "TypeScript, Python, and cloud architecture"
            return (
                f"I am excited to apply for the {role} position. With 5+ years of experience designing and scaling "
                f"production systems using {top_skills}, I specialize in building resilient architectures, optimizing "
                f"performance, and delivering customer-facing features. I look forward to contributing to your team's engineering goals."
            )

        # Fallback default
        return ""
