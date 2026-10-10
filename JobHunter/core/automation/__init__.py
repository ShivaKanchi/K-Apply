"""Form Autofill and Browser Automation Package"""
from .browser_manager import BrowserManager
from .form_detector import FormDetector
from .form_filler import FormFiller
from .submission import SubmissionController

__all__ = ["BrowserManager", "FormDetector", "FormFiller", "SubmissionController"]
