import re
from pathlib import Path
from typing import Dict, Any, List

class ResumeParser:
    """Extracts structured information from resumes (PDF, DOCX, Markdown, TXT)."""

    def __init__(self, file_path: str):
        self.path = Path(file_path)
        if not self.path.exists():
            raise FileNotFoundError(f"Resume file not found at: {file_path}")
        self.raw_text = self._read_content()

    def _read_content(self) -> str:
        ext = self.path.suffix.lower()
        if ext in [".md", ".txt"]:
            return self.path.read_text(encoding="utf-8", errors="ignore")
        elif ext == ".pdf":
            return self._read_pdf()
        elif ext in [".docx", ".doc"]:
            return self._read_docx()
        else:
            # Fallback text read
            return self.path.read_text(encoding="utf-8", errors="ignore")

    def _read_pdf(self) -> str:
        try:
            import pypdf
            reader = pypdf.PdfReader(str(self.path))
            text_parts = []
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    text_parts.append(txt)
            return "\n".join(text_parts)
        except Exception as e:
            return f"[Error reading PDF: {e}]"

    def _read_docx(self) -> str:
        try:
            import docx
            doc = docx.Document(str(self.path))
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            return f"[Error reading DOCX: {e}]"

    def parse(self) -> Dict[str, Any]:
        """Parses the raw text into structured attributes."""
        text = self.raw_text
        email = self._extract_email(text)
        phone = self._extract_phone(text)
        linkedin = self._extract_linkedin(text)
        github = self._extract_github(text)
        skills = self._extract_skills(text)
        
        return {
            "file_name": self.path.name,
            "raw_text": text,
            "contact": {
                "email": email,
                "phone": phone,
                "linkedin": linkedin,
                "github": github,
            },
            "skills": skills,
            "char_count": len(text),
            "line_count": len(text.splitlines())
        }

    def _extract_email(self, text: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)[\d\s.-]{7,10}', text)
        return match.group(0).strip() if match else ""

    def _extract_linkedin(self, text: str) -> str:
        match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?', text)
        return match.group(0) if match else ""

    def _extract_github(self, text: str) -> str:
        match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', text)
        return match.group(0) if match else ""

    def _extract_skills(self, text: str) -> List[str]:
        # Identify common tech skills mentioned in text
        skill_catalog = [
            "python", "javascript", "typescript", "react", "next.js", "node.js",
            "vue", "angular", "go", "golang", "java", "c++", "c#", "ruby", "rails",
            "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "kafka",
            "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd",
            "git", "graphql", "rest", "fastapi", "django", "flask", "express",
            "html", "css", "tailwind", "microservices", "distributed systems", "system design"
        ]
        found = []
        lower = text.lower()
        for s in skill_catalog:
            # Word boundary check or exact token
            pattern = rf"\b{re.escape(s)}\b"
            if re.search(pattern, lower):
                found.append(s)
        return sorted(list(set(found)))
