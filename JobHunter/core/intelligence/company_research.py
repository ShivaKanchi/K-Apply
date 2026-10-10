from typing import Dict, Any

class CompanyResearcher:
    """Provides company context, known interview patterns, and core values."""

    # Curated knowledge base of known interview styles for major companies
    KNOWN_COMPANIES = {
        "stripe": {
            "name": "Stripe",
            "domain": "Fintech / Global Payments Infrastructure",
            "values": ["Users first", "Move fast", "Operate with rigor", "Speak the truth"],
            "interview_style": "Hands-on coding in candidate's own editor, real-world bug squash, API design, system design (idempotency, payment ledgers, high reliability).",
            "culture_tags": ["developer-first", "writing-heavy", "high-rigor", "humble"]
        },
        "amazon": {
            "name": "Amazon",
            "domain": "E-Commerce / Cloud Computing (AWS)",
            "values": ["Customer Obsession", "Ownership", "Invent and Simplify", "Bias for Action", "Earn Trust", "Deliver Results"],
            "interview_style": "Heavy STAR-format behavioral questioning mapped strictly to Leadership Principles, followed by LeetCode medium/hard algorithms and distributed systems design.",
            "culture_tags": ["frugal", "bar-raiser", "data-driven", "fast-paced"]
        },
        "google": {
            "name": "Google",
            "domain": "Search / Cloud / AI / Infrastructure",
            "values": ["Focus on the user", "Fast is better than slow", "Democracy on the web", "Do the right thing"],
            "interview_style": "Data structures & algorithms, Googleyness & leadership, scalable system design (RPCs, Spanner, BigTable, MapReduce concepts).",
            "culture_tags": ["engineering-excellence", "consensus-driven", "scalability"]
        },
        "meta": {
            "name": "Meta",
            "domain": "Social Tech / Metaverse / AI",
            "values": ["Move Fast", "Focus on Long-Term Impact", "Build Awesome Things", "Live in the Future", "Be Direct"],
            "interview_style": "Speed coding (2 medium LeetCode problems in 45 min), end-to-end product architecture (Newsfeed, Messenger, Instagram).",
            "culture_tags": ["speed", "product-impact", "bottom-up"]
        },
        "netflix": {
            "name": "Netflix",
            "domain": "Streaming Entertainment & Cloud Architecture",
            "values": ["Judgment", "Communication", "Curiosity", "Courage", "Passion", "Selflessness", "Inclusion", "Integrity", "Impact"],
            "interview_style": "Deep system design, microservices fault tolerance (Chaos Monkey, resilient circuit breakers), culture memo alignment.",
            "culture_tags": ["freedom-and-responsibility", "high-density-talent", "candor"]
        }
    }

    def research(self, company_name: str) -> Dict[str, Any]:
        key = company_name.strip().lower()
        if key in self.KNOWN_COMPANIES:
            return self.KNOWN_COMPANIES[key]

        # Generic fallback synthesis for emerging / startup companies
        return {
            "name": company_name.title(),
            "domain": "Technology / Software Services",
            "values": ["Customer Focus", "Innovation", "Collaboration", "Velocity", "Continuous Improvement"],
            "interview_style": "Technical screening on core stack, practical coding or take-home review, system design architecture, and behavioral team fit.",
            "culture_tags": ["agile", "collaborative", "high-ownership"]
        }
