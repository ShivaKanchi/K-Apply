from typing import List, Dict, Any

class FormDetector:
    """Detects and categorizes form elements on standard ATS and custom job application pages."""

    FIELD_SELECTORS = {
        "first_name": [
            "input[name*='first' i]", "input[id*='first' i]", "input[placeholder*='first name' i]",
            "input[autocomplete='given-name']"
        ],
        "last_name": [
            "input[name*='last' i]", "input[id*='last' i]", "input[placeholder*='last name' i]",
            "input[autocomplete='family-name']"
        ],
        "full_name": [
            "input[name='name' i]", "input[id='name' i]", "input[placeholder*='full name' i]",
            "input[autocomplete='name']"
        ],
        "email": [
            "input[type='email']", "input[name*='email' i]", "input[id*='email' i]",
            "input[placeholder*='email' i]", "input[autocomplete='email']"
        ],
        "phone": [
            "input[type='tel']", "input[name*='phone' i]", "input[id*='phone' i]",
            "input[placeholder*='phone' i]", "input[autocomplete='tel']"
        ],
        "linkedin": [
            "input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[placeholder*='linkedin' i]"
        ],
        "github": [
            "input[name*='github' i]", "input[id*='github' i]", "input[placeholder*='github' i]"
        ],
        "portfolio": [
            "input[name*='website' i]", "input[name*='portfolio' i]", "input[placeholder*='portfolio' i]"
        ],
        "resume_file": [
            "input[type='file'][name*='resume' i]", "input[type='file'][id*='resume' i]",
            "input[type='file'][accept*='pdf' i]", "input[type='file']"
        ]
    }

    @classmethod
    def scan_page_elements(cls, page) -> Dict[str, Any]:
        """Scans the page and identifies available form fields and their matching selectors."""
        detected = {}
        for field_name, selector_list in cls.FIELD_SELECTORS.items():
            for sel in selector_list:
                try:
                    locator = page.locator(sel).first
                    if locator.count() > 0 and locator.is_visible():
                        detected[field_name] = sel
                        break
                except Exception:
                    continue

        # Check for general textareas (cover letter, screening)
        try:
            textareas = page.locator("textarea").all()
            detected["textareas_count"] = len(textareas)
        except Exception:
            detected["textareas_count"] = 0

        # Check for submit buttons
        detected["submit_btn"] = None
        submit_selectors = [
            "button[type='submit']", "input[type='submit']",
            "button:has-text('Submit')", "button:has-text('Apply')",
            "button:has-text('Review')"
        ]
        for btn_sel in submit_selectors:
            try:
                btn = page.locator(btn_sel).first
                if btn.count() > 0 and btn.is_visible():
                    detected["submit_btn"] = btn_sel
                    break
            except Exception:
                continue

        return detected
