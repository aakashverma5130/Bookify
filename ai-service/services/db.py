import psycopg2
import os
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/booksphere")

def get_connection():
    """Create a new read-only-style connection to PostgreSQL."""
    conn = psycopg2.connect(DATABASE_URL)
    conn.set_session(readonly=True, autocommit=True)
    return conn

@contextmanager
def get_cursor():
    """Context manager for database queries."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
    finally:
        conn.close()
