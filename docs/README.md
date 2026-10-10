# 📚 K-Apply Documentation Index & Engineering Knowledge Base

Welcome to the comprehensive architecture, data specifications, API reference, and candidate knowledge suite for **K-Apply**.

---

## 📑 Documentation Index

### 1. Data Specifications & Knowledge Vaults

| Document | Description | Target Audience |
| :--- | :--- | :--- |
| [**Candidate Master Data & Q&A**](CANDIDATE_DATA.md) | Candidate profile schema, categorized screening answer templates, resume variants, and outreach templates. | Candidates & Automation Engineers |
| [**ATS Field Mappings & Detection**](ATS_FIELD_MAPPINGS.md) | Heuristic scoring matrix, regex pattern dictionaries, React `_valueTracker` bypass, and DOM event injection pipelines. | Browser Automation & Frontend Developers |
| [**Data Schemas & Seeds**](DATA_SCHEMAS_AND_SEEDS.md) | MongoDB collections (`profile`, `qa`, `applications`), SQLite table schemas, Chrome local storage layout, and JSON templates. | Full-Stack & Database Engineers |
| [**Answer Template**](../JobUtils.md) | Blank, unformatted answer template to fill in your own responses. | General Reference |

### 2. System Architecture & Engineering Guides

| Document | Description | Target Audience |
| :--- | :--- | :--- |
| [**System Architecture**](ARCHITECTURE.md) | High-level engineering blueprint, Three Pillars overview, IPC bridges, and cross-layer data flow. | System Architects & Developers |
| [**Extension Internals**](EXTENSION_INTERNALS.md) | Manifest V3 design, multi-signal scoring, in-page slide-out audit drawer, and dynamic template variables. | Browser Extension Developers |
| [**Autonomous Hunter**](AUTONOMOUS_HUNTER.md) | Multi-ATS board crawlers (Greenhouse, Lever, Ashby), resume match scoring algorithm, and Playwright HITL review runner. | Scraping & Automation Developers |
| [**Command Center & REST API**](COMMAND_CENTER_AND_API.md) | Next.js App Router specifications, REST endpoints (`/api/hunter`, `/api/ai/*`, `/api/applications`), and MongoDB pooling. | Full-Stack & Integration Engineers |
| [**Data Flow, Privacy & Security**](DATA_FLOW_AND_SECURITY.md) | Zero-telemetry model, local Ollama execution, database schemas, and backup/restore workflows. | Security, Privacy & DevOps |
| [**Configuration & Setup Guide**](CONFIGURATION_AND_SETUP.md) | End-to-end setup guide for the Chrome extension, Next.js Command Center, JobHunter Python engine, and Ollama local AI. | Developers & Users |

---

## 🚀 Quick Links

- **Root Project Overview**: [`../README.md`](../README.md)
- **Web Dashboard**: [`../web-dashboard`](../web-dashboard)
- **Hunter Automation Engine**: [`../JobHunter`](../JobHunter)
