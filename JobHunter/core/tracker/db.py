import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

class JobTrackerDB:
    """Manages SQLite storage for job postings, match scores, apply links, and application status."""

    def __init__(self, db_path: str = "data/job_hunter.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    company TEXT NOT NULL,
                    portal TEXT NOT NULL,
                    title TEXT NOT NULL,
                    location TEXT,
                    apply_url TEXT NOT NULL,
                    match_score INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'discovered',
                    notes TEXT,
                    discovered_at TIMESTAMP,
                    applied_at TIMESTAMP
                );
            """)
            conn.commit()

    def add_or_update_job(self, job: Dict[str, Any], match_score: int = 0) -> str:
        job_id = f"{job.get('portal', 'gen')}_{job.get('company', '')}_{job.get('id', job.get('title', ''))}".lower().replace(" ", "_")
        apply_url = job.get("apply_url", "")
        now = datetime.utcnow().isoformat()

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO jobs (id, company, portal, title, location, apply_url, match_score, status, discovered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ready_to_apply', ?)
                ON CONFLICT(id) DO UPDATE SET
                    match_score = excluded.match_score,
                    apply_url = excluded.apply_url,
                    location = excluded.location
            """, (
                job_id,
                job.get("company", ""),
                job.get("portal", "generic"),
                job.get("title", ""),
                job.get("location", "Remote/Unspecified"),
                apply_url,
                match_score,
                now
            ))
            conn.commit()
        return job_id

    def list_jobs(self, status: Optional[str] = None, min_score: int = 0) -> List[Dict[str, Any]]:
        query = "SELECT * FROM jobs WHERE match_score >= ?"
        params: List[Any] = [min_score]

        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY match_score DESC, discovered_at DESC"

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]

    def update_status(self, job_id: str, status: str, notes: str = ""):
        now = datetime.utcnow().isoformat() if status == "applied" else None
        with self._get_connection() as conn:
            if now:
                conn.execute("UPDATE jobs SET status = ?, notes = ?, applied_at = ? WHERE id = ?", (status, notes, now, job_id))
            else:
                conn.execute("UPDATE jobs SET status = ?, notes = ? WHERE id = ?", (status, notes, job_id))
            conn.commit()
