from fastapi import APIRouter
from typing import List, Dict, Any
from services.db import get_cursor

router = APIRouter()

@router.get("/recommendations/{student_id}")
def get_recommendations(student_id: str) -> Dict[str, Any]:
    """
    Generate personalized book recommendations for a student.
    Logic (explainable, in priority order):
      1. Books in categories the student has borrowed most
      2. Other books by authors the student has read
      3. Most borrowed books this month (popularity)
      4. Frequently co-borrowed with books the student has read
    All deduplicated against books already borrowed.
    """
    recommendations = []
    seen_book_ids = set()

    with get_cursor() as cur:
        # Already borrowed
        cur.execute(
            """SELECT DISTINCT bc.book_id
               FROM issues i
               JOIN book_copies bc ON bc.copy_id = i.copy_id
               WHERE i.student_id = %s""",
            (student_id,)
        )
        already_borrowed = {r[0] for r in cur.fetchall()}
        seen_book_ids.update(already_borrowed)

        # 1. Same category
        cur.execute(
            """SELECT b.book_id, b.title, b.cover_image_url, a.name AS author_name
               FROM books b
               LEFT JOIN authors a ON a.author_id = b.author_id
               WHERE b.category_id IN (
                   SELECT DISTINCT bk.category_id
                   FROM issues i
                   JOIN book_copies bc ON bc.copy_id = i.copy_id
                   JOIN books bk       ON bk.book_id  = bc.book_id
                   WHERE i.student_id = %s AND bk.category_id IS NOT NULL
               )
               AND b.available_copies > 0
               AND b.book_id NOT IN %s
               ORDER BY b.available_copies DESC
               LIMIT 5""",
            (student_id, tuple(seen_book_ids) or ('',))
        )
        for row in cur.fetchall():
            if row[0] not in seen_book_ids:
                recommendations.append({
                    "book_id": row[0],
                    "title": row[1],
                    "cover_image_url": row[2],
                    "author_name": row[3],
                    "reason": "Based on categories you've read",
                })
                seen_book_ids.add(row[0])

        # 2. Same author
        cur.execute(
            """SELECT b.book_id, b.title, b.cover_image_url, a.name AS author_name
               FROM books b
               JOIN authors a ON a.author_id = b.author_id
               WHERE b.author_id IN (
                   SELECT DISTINCT bk.author_id
                   FROM issues i
                   JOIN book_copies bc ON bc.copy_id = i.copy_id
                   JOIN books bk       ON bk.book_id  = bc.book_id
                   WHERE i.student_id = %s AND bk.author_id IS NOT NULL
               )
               AND b.available_copies > 0
               AND b.book_id NOT IN %s
               LIMIT 3""",
            (student_id, tuple(seen_book_ids) or ('',))
        )
        for row in cur.fetchall():
            if row[0] not in seen_book_ids:
                recommendations.append({
                    "book_id": row[0],
                    "title": row[1],
                    "cover_image_url": row[2],
                    "author_name": row[3],
                    "reason": "By an author you've read",
                })
                seen_book_ids.add(row[0])

        # 3. Popular this month
        cur.execute(
            """SELECT b.book_id, b.title, b.cover_image_url, a.name AS author_name,
                      COUNT(i.issue_id) AS borrow_count
               FROM issues i
               JOIN book_copies bc ON bc.copy_id = i.copy_id
               JOIN books b        ON b.book_id  = bc.book_id
               LEFT JOIN authors a ON a.author_id = b.author_id
               WHERE i.issue_date >= NOW() - INTERVAL '30 days'
                 AND b.available_copies > 0
                 AND b.book_id NOT IN %s
               GROUP BY b.book_id, b.title, b.cover_image_url, a.name
               ORDER BY borrow_count DESC
               LIMIT 4""",
            (tuple(seen_book_ids) or ('',),)
        )
        for row in cur.fetchall():
            if row[0] not in seen_book_ids:
                recommendations.append({
                    "book_id": row[0],
                    "title": row[1],
                    "cover_image_url": row[2],
                    "author_name": row[3],
                    "reason": "Popular this month",
                })
                seen_book_ids.add(row[0])

    return {"student_id": student_id, "recommendations": recommendations}
