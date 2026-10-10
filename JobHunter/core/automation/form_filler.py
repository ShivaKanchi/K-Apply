import os
from pathlib import Path
from typing import Dict, Any, List
from .form_detector import FormDetector
from ..intelligence.answer_engine import AnswerEngine

class FormFiller:
    """Fills web job application forms using detected inputs and AnswerEngine reasoning."""

    def __init__(self, profile_data: Dict[str, Any]):
        self.profile = profile_data
        self.answer_engine = AnswerEngine(profile_data)

    def autofill(self, page) -> Dict[str, Any]:
        """
        Interacts with the live browser page to fill out detected fields.
        Returns report of populated fields and status.
        """
        elements = FormDetector.scan_page_elements(page)
        report = {
            "filled": [],
            "failed": [],
            "resume_attached": False,
            "ready_for_review": False
        }

        personal = self.profile.get("personal", {})
        social = self.profile.get("social", {})

        # 1. Fill Name fields
        if "first_name" in elements and personal.get("first_name"):
            self._fill_field(page, elements["first_name"], personal["first_name"], "First Name", report)
        if "last_name" in elements and personal.get("last_name"):
            self._fill_field(page, elements["last_name"], personal["last_name"], "Last Name", report)
        if "full_name" in elements and personal.get("full_name"):
            self._fill_field(page, elements["full_name"], personal["full_name"], "Full Name", report)

        # 2. Fill Contact
        if "email" in elements and personal.get("email"):
            self._fill_field(page, elements["email"], personal["email"], "Email", report)
        if "phone" in elements and personal.get("phone"):
            self._fill_field(page, elements["phone"], personal["phone"], "Phone", report)

        # 3. Fill Social links
        if "linkedin" in elements and social.get("linkedin"):
            self._fill_field(page, elements["linkedin"], social["linkedin"], "LinkedIn", report)
        if "github" in elements and social.get("github"):
            self._fill_field(page, elements["github"], social["github"], "GitHub", report)
        if "portfolio" in elements and social.get("portfolio"):
            self._fill_field(page, elements["portfolio"], social["portfolio"], "Portfolio", report)

        # 4. Attach Resume
        resume_path = self.profile.get("resume_path")
        if resume_path and os.path.exists(resume_path) and "resume_file" in elements:
            try:
                file_input = page.locator(elements["resume_file"]).first
                file_input.set_input_files(os.path.abspath(resume_path))
                report["resume_attached"] = True
                report["filled"].append("Resume File Uploaded")
            except Exception as e:
                report["failed"].append(f"Resume upload failed: {e}")

        # 5. Handle Textareas (Cover letters, "Why us?")
        try:
            textareas = page.locator("textarea").all()
            for idx, ta in enumerate(textareas):
                if ta.is_visible() and not ta.input_value():
                    # Check parent label or placeholder
                    placeholder = ta.get_attribute("placeholder") or ""
                    label_text = self._get_surrounding_label(ta) or placeholder or f"Question {idx+1}"
                    ans = self.answer_engine.answer_question(label_text)
                    if ans:
                        ta.fill(ans)
                        report["filled"].append(f"Answered: '{label_text[:30]}...'")
        except Exception:
            pass

        report["ready_for_review"] = len(report["filled"]) >= 3
        return report

    def _fill_field(self, page, selector: str, value: str, field_name: str, report: Dict[str, Any]):
        try:
            loc = page.locator(selector).first
            if loc.is_visible():
                current_val = loc.input_value()
                if not current_val: # Only fill if empty
                    loc.fill(value)
                    report["filled"].append(field_name)
        except Exception as e:
            report["failed"].append(f"{field_name} error: {e}")

    def _get_surrounding_label(self, element) -> str:
        try:
            # Look for closest label or previous sibling text
            label = element.evaluate("""el => {
                const parent = el.closest('div, label, fieldset');
                if (!parent) return '';
                const lbl = parent.querySelector('label');
                return lbl ? lbl.innerText : '';
            }""")
            return label or ""
        except Exception:
            return ""
