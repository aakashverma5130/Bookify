import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/bookify")
SQLITE_DB_PATH = Path(__file__).resolve().parent.parent.parent / "backend" / "bookify_dev.db"

def get_connection():
    """Create a new read-only connection (PostgreSQL or fallback SQLite)."""
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=2)
        conn.set_session(readonly=True, autocommit=True)
        return conn, "postgres"
    except Exception:
        # Fallback to local SQLite database
        conn = sqlite3.connect(str(SQLITE_DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"

@contextmanager
def get_cursor():
    """Context manager for database queries."""
    conn, engine = get_connection()
    try:
        cursor = conn.cursor()
        yield cursor
    finally:
        conn.close()
