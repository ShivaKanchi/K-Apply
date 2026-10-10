import sys
from pathlib import Path

# Ensure JobHunter package directory is in sys.path for test discovery from anywhere
job_hunter_dir = Path(__file__).resolve().parent.parent
if str(job_hunter_dir) not in sys.path:
    sys.path.insert(0, str(job_hunter_dir))
