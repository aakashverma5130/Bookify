from fastapi import APIRouter
from services.db import get_cursor
import os
import psycopg2

router = APIRouter()

WINDOW_DAYS       = int(os.getenv("FORECAST_WINDOW_DAYS", "90"))
HIGH_THRESHOLD    = int(os.getenv("FORECAST_HIGH_THRESHOLD", "10"))
MEDIUM_THRESHOLD  = int(os.getenv("FORECAST_MEDIUM_THRESHOLD", "4"))

@router.get("/demand-forecast")
def demand_forecast():
    """
    Compute demand forecast for all books and upsert results into demand_forecasts.
    Uses a simple, explainable model:
      - issue_count in last WINDOW_DAYS days (weighted 70%)
      - reservation queue length × 5 (weighted 30%)
      - Normalized to 0–1 score
      - Bucketed into HIGH / MEDIUM / LOW priority

    Results are written to the demand_forecasts table for caching.
    """
    with get_cursor() as cur:
        # Temporarily use a read-write connection for upsert
        pass  # read cursor closed

    # Need a write connection for this operation
    import psycopg2
    import os
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # Fetch issue counts per book in the time window
            cur.execute(
                """SELECT bc.book_id,
                          COUNT(i.issue_id) AS issue_count
                   FROM issues i
                   JOIN book_copies bc ON bc.copy_id = i.copy_id
                   WHERE i.issue_date >= NOW() - INTERVAL '%s days'
                   GROUP BY bc.book_id""" % WINDOW_DAYS
            )
            issue_counts = {row[0]: row[1] for row in cur.fetchall()}

            # Fetch reservation queue lengths
            cur.execute(
                """SELECT book_id, COUNT(*) AS queue_length
                   FROM book_reservations
                   WHERE status IN ('WAITING', 'NOTIFIED')
                   GROUP BY book_id"""
            )
            queue_lengths = {row[0]: row[1] for row in cur.fetchall()}

            # Fetch all books
            cur.execute("SELECT book_id, title FROM books")
            books = cur.fetchall()

            # Compute scores
            all_scores = []
            for book_id, title in books:
                issue_count   = issue_counts.get(book_id, 0)
                queue_length  = queue_lengths.get(book_id, 0)
                raw_score     = 0.7 * issue_count + 0.3 * (queue_length * 5)
                all_scores.append((book_id, title, issue_count, queue_length, raw_score))

            # Normalize
            max_score = max((s[4] for s in all_scores), default=1) or 1
            results = []
            for book_id, title, issue_count, queue_length, raw_score in all_scores:
                normalized = raw_score / max_score
                if normalized >= 0.6 or issue_count >= HIGH_THRESHOLD:
                    priority = "HIGH"
                elif normalized >= 0.2 or issue_count >= MEDIUM_THRESHOLD:
                    priority = "MEDIUM"
                else:
                    priority = "LOW"

                reasoning = (
                    f"{issue_count} issues in last {WINDOW_DAYS} days; "
                    f"{queue_length} students on waitlist."
                )
                if priority == "HIGH":
                    reasoning += " Strongly recommended to purchase additional copies."
                elif priority == "MEDIUM":
                    reasoning += " Current stock may be insufficient; monitor closely."
                else:
                    reasoning += " Current stock is adequate."

                results.append((book_id, round(normalized, 4), priority, reasoning))

            # Upsert into demand_forecasts
            for book_id, score, priority, reasoning in results:
                cur.execute(
                    """INSERT INTO demand_forecasts (book_id, predicted_demand_score, priority, reasoning, generated_at)
                       VALUES (%s, %s, %s, %s, NOW())
                       ON CONFLICT (book_id) DO UPDATE
                       SET predicted_demand_score = EXCLUDED.predicted_demand_score,
                           priority               = EXCLUDED.priority,
                           reasoning              = EXCLUDED.reasoning,
                           generated_at           = NOW()""",
                    (book_id, score, priority, reasoning)
                )

            conn.commit()

        return {
            "status": "ok",
            "books_processed": len(results),
            "high_priority":   sum(1 for r in results if r[2] == "HIGH"),
            "medium_priority": sum(1 for r in results if r[2] == "MEDIUM"),
            "low_priority":    sum(1 for r in results if r[2] == "LOW"),
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
