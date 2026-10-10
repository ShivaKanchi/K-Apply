import os
from pathlib import Path
from typing import Optional

class BrowserManager:
    """Manages Playwright browser lifecycle with persistent user profile and stealth headers."""

    def __init__(self, user_data_dir: str = "./data/browser_profile", headless: bool = False, slow_mo: int = 200):
        self.user_data_dir = Path(user_data_dir)
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        self.headless = headless
        self.slow_mo = slow_mo
        self.playwright = None
        self.browser_context = None
        self.active_page = None

    def start(self):
        """Launches the persistent browser context."""
        try:
            from playwright.sync_api import sync_playwright
            self.playwright = sync_playwright().start()
            
            # Use launch_persistent_context to maintain logins & prevent bot flags
            self.browser_context = self.playwright.chromium.launch_persistent_context(
                user_data_dir=str(self.user_data_dir),
                headless=self.headless,
                slow_mo=self.slow_mo,
                viewport={"width": 1280, "height": 850},
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-infobars"
                ]
            )
            self.active_page = self.browser_context.pages[0] if self.browser_context.pages else self.browser_context.new_page()
            return self.active_page
        except ImportError:
            raise RuntimeError("Playwright is not installed. Please run: pip install playwright && playwright install chromium")

    def open_url(self, url: str):
        if not self.active_page:
            self.start()
        self.active_page.goto(url, wait_until="domcontentloaded", timeout=45000)
        return self.active_page

    def close(self):
        try:
            if self.browser_context:
                self.browser_context.close()
            if self.playwright:
                self.playwright.stop()
        except Exception:
            pass
        self.active_page = None
        self.browser_context = None
        self.playwright = None
