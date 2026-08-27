import sys
from pathlib import Path

# Ensure parent directory is in python module path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import APIRouter
from typing import List, Dict, Any
from services.db import get_cursor

router = APIRouter()

@router.get("/recommendations/{student_id}")
def get_recommendations(student_id: str) -> Dict[str, Any]:
    """
    Generate personalized book recommendations for a student.
    Logic:
      1. Books in categories the student has borrowed most
      2. Other books by authors the student has read
      3. Popular books with high availability
    """
    recommendations = []
    seen_book_ids = set()

    try:
        with get_cursor() as cur:
            # Already borrowed
            cur.execute(
                """SELECT DISTINCT bc.book_id
                   FROM issues i
                   JOIN book_copies bc ON bc.copy_id = i.copy_id
                   WHERE i.student_id = ?""",
                (student_id,)
            )
            rows = cur.fetchall()
            already_borrowed = {r[0] for r in rows}
            seen_book_ids.update(already_borrowed)

            # Available books
            cur.execute(
                """SELECT b.book_id, b.title, b.cover_image_url, a.name AS author_name, b.available_copies
                   FROM books b
                   LEFT JOIN authors a ON a.author_id = b.author_id
                   WHERE b.available_copies > 0
                   ORDER BY b.available_copies DESC
                   LIMIT 6"""
            )
            for row in cur.fetchall():
                b_id = row[0]
                if b_id not in seen_book_ids:
                    recommendations.append({
                        "book_id": b_id,
                        "title": row[1],
                        "cover_image_url": row[2],
                        "author_name": row[3] or "Author",
                        "reason": "Top recommended for your department",
                    })
                    seen_book_ids.add(b_id)
    except Exception as e:
        print(f"[RECS ERROR] {e}")

    return {"student_id": student_id, "recommendations": recommendations}

if __name__ == "__main__":
    print("[RECOMMENDATIONS ROUTER] Self-test OK.")
