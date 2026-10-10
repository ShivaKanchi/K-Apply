from typing import Dict, Any, List
from .company_research import CompanyResearcher

class QuestionGenerator:
    """
    Generates company-tailored screening questions and the most asked interview questions
    based on the candidate's resume and target role.
    """

    def __init__(self):
        self.researcher = CompanyResearcher()

    def generate_intelligence_pack(
        self,
        company_name: str,
        target_role: str,
        candidate_profile: Dict[str, Any],
        job_description: str = ""
    ) -> Dict[str, Any]:
        """
        Produces a complete intelligence pack:
        1. Company profile & culture memo
        2. Application Form Screening Q&As (ready to autofill)
        3. Most Asked Interview Questions (Technical & Behavioral) tailored to skills & resume
        """
        company_info = self.researcher.research(company_name)
        skills = candidate_profile.get("skills", ["TypeScript", "Python", "React", "PostgreSQL", "AWS"])
        resume_text = candidate_profile.get("resume_text", "")
        auth = candidate_profile.get("work_authorization", {})
        salary = candidate_profile.get("salary_expectation", "$140k - $175k")
        notice = candidate_profile.get("notice_period_weeks", 2)

        # 1. Screening Questions & Pre-computed Answers
        screening_qa = self._generate_screening_qa(company_info, target_role, skills, auth, salary, notice)

        # 2. Company Most Frequently Asked Interview Questions
        interview_questions = self._generate_interview_questions(company_info, target_role, skills)

        # 3. Resume Evidence Mapping (STAR points from candidate experience)
        resume_star_mapping = self._extract_star_highlights(resume_text, skills)

        return {
            "company": company_info,
            "target_role": target_role,
            "screening_qa": screening_qa,
            "interview_questions": interview_questions,
            "resume_star_mapping": resume_star_mapping
        }

    def _generate_screening_qa(
        self,
        company: Dict[str, Any],
        role: str,
        skills: List[str],
        auth: Dict[str, Any],
        salary: str,
        notice: int
    ) -> List[Dict[str, str]]:
        c_name = company["name"]
        values_str = ", ".join(company.get("values", [])[:3])
        top_skills = ", ".join(skills[:4]) if skills else "TypeScript, Python, and cloud architecture"

        return [
            {
                "question": f"Why do you want to join {c_name}?",
                "field_type": "long_text",
                "answer": (
                    f"I have long admired {c_name}'s dedication to {company.get('domain', 'technology')} and its core values of {values_str}. "
                    f"With my background in {top_skills} building scalable, high-throughput systems, I am excited by the opportunity to contribute "
                    f"to {c_name}'s mission, solve complex architectural challenges, and deliver impactful software to end users."
                )
            },
            {
                "question": f"Describe your relevant experience for this {role} role.",
                "field_type": "long_text",
                "answer": (
                    f"I have extensive experience as a {role}, leading microservices development, optimizing database and API response times, "
                    f"and architecting cloud-native solutions using {top_skills}. In my previous positions, I successfully improved system performance "
                    f"by over 40% and built resilient end-to-end applications serving hundreds of thousands of users."
                )
            },
            {
                "question": "What are your salary expectations?",
                "field_type": "short_text",
                "answer": f"{salary} (negotiable based on total compensation and equity)"
            },
            {
                "question": "What is your notice period / availability to start?",
                "field_type": "short_text",
                "answer": f"{notice} weeks from offer acceptance"
            },
            {
                "question": "Are you legally authorized to work in this country?",
                "field_type": "boolean",
                "answer": "Yes" if auth.get("authorized_to_work", True) else "No"
            },
            {
                "question": "Will you now or in the future require visa sponsorship?",
                "field_type": "boolean",
                "answer": "Yes" if auth.get("requires_sponsorship", False) else "No"
            }
        ]

    def _generate_interview_questions(
        self,
        company: Dict[str, Any],
        role: str,
        skills: List[str]
    ) -> Dict[str, List[Dict[str, str]]]:
        c_name = company["name"]
        style = company.get("interview_style", "")

        behavioral = [
            {
                "question": f"Tell me about a time you had a disagreement with a team member or product manager. How did you resolve it?",
                "category": "Team Collaboration / Alignment",
                "tip": f"Align your answer with {c_name}'s culture: focus on data, customer empathy, and respectful objective discussions."
            },
            {
                "question": "Describe a situation where a production outage or critical bug occurred. How did you diagnose, mitigate, and prevent recurrence?",
                "category": "Operational Excellence & Rigor",
                "tip": "Use STAR format: Outline immediate mitigation (rollback/hotfix), root cause analysis (5 whys), and long-term automated monitors."
            },
            {
                "question": f"Why {c_name} and not your current company or competitors?",
                "category": "Motivation & Culture Fit",
                "tip": f"Reference {c_name}'s known values ({', '.join(company.get('values', [])[:2])}) and specific engineering challenges in their domain."
            },
            {
                "question": "Tell me about a project where you had ambiguous requirements or tight deadlines. How did you prioritize?",
                "category": "Ownership & Delivery",
                "tip": "Explain how you scoped MVP features, communicated trade-offs with stakeholders, and delivered incrementally."
            }
        ]

        technical = [
            {
                "question": f"How would you design a scalable, fault-tolerant backend system for {company.get('domain', 'high traffic')} services?",
                "category": "System Design & Architecture",
                "key_concepts": "Load balancing, distributed caching (Redis), asynchronous task queues (Kafka/RabbitMQ), database sharding/indexing, idempotency."
            },
            {
                "question": f"In a {role} stack ({', '.join(skills[:3]) if skills else 'TypeScript/Python'}), how do you handle state management, API latency, and caching?",
                "category": "Technical Deep Dive",
                "key_concepts": "Optimistic UI updates, connection pooling, Redis TTL strategies, CDN edge caching, database query optimization."
            },
            {
                "question": "How do you ensure zero-downtime database migrations and safe API versioning in production?",
                "category": "DevOps & Infrastructure",
                "key_concepts": "Expand-and-contract pattern, blue/green or canary deployments, backward-compatible schemas, automated integration testing."
            },
            {
                "question": "What strategies do you use for secure authentication and authorization across distributed services?",
                "category": "Security & Best Practices",
                "key_concepts": "OAuth2/OIDC, JWT validation with asymmetric signing (RS256), rate limiting, RBAC, least privilege IAM."
            }
        ]

        return {
            "behavioral": behavioral,
            "technical": technical,
            "format_notes": style
        }

    def _extract_star_highlights(self, resume_text: str, skills: List[str]) -> List[Dict[str, str]]:
        """Synthesizes key STAR accomplishment snippets from the resume for quick recall during interviews."""
        highlights = []
        if "latency" in resume_text.lower() or "reduced" in resume_text.lower():
            highlights.append({
                "theme": "Performance & Latency Optimization",
                "star": "Situation: Legacy latency issues. Task: Optimize database and caching. Action: Redesigned indexing and introduced Redis caching. Result: 40%+ reduction in response times."
            })
        if "microservices" in resume_text.lower() or "docker" in resume_text.lower():
            highlights.append({
                "theme": "Architecture & Modernization",
                "star": "Situation: Monolithic scaling constraints. Task: Migrate to microservices. Action: Containerized services using Docker/Terraform on AWS ECS. Result: Improved deployment velocity and infrastructure cost savings."
            })
        if "real-time" in resume_text.lower() or "kafka" in resume_text.lower() or "websocket" in resume_text.lower():
            highlights.append({
                "theme": "Real-time & Distributed Streaming",
                "star": "Situation: Need for instant alert streaming. Task: Architect low-latency event pipeline. Action: Built Kafka + WebSocket pipeline. Result: Handled 10k msgs/sec with sub-50ms latency."
            })

        if not highlights:
            highlights.append({
                "theme": "General Engineering Impact",
                "star": "Delivered high-availability full stack features, automated CI/CD pipelines, and improved test coverage above 85%."
            })

        return highlights
