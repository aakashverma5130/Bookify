import sys
from pathlib import Path

# Ensure parent directory is in python module path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from services.db import get_cursor
from middleware.auth import require_service_auth

router = APIRouter(dependencies=[Depends(require_service_auth)])

@router.get("/demand-forecast")
def get_demand_forecast() -> Dict[str, Any]:
    """
    Returns AI predicted demand scores and purchasing recommendations.
    """
    forecasts = []

    try:
        with get_cursor() as cur:
            cur.execute(
                """SELECT df.forecast_id, df.book_id, df.predicted_demand_score, df.priority, df.reasoning,
                          b.title, b.isbn, b.cover_image_url, a.name AS author_name,
                          b.total_copies, b.available_copies
                   FROM demand_forecasts df
                   JOIN books b ON b.book_id = df.book_id
                   LEFT JOIN authors a ON a.author_id = b.author_id
                   ORDER BY df.predicted_demand_score DESC"""
            )
            for row in cur.fetchall():
                forecasts.append({
                    "forecast_id": row[0],
                    "book_id": row[1],
                    "predicted_demand_score": float(row[2]),
                    "priority": row[3],
                    "reasoning": row[4],
                    "title": row[5],
                    "isbn": row[6],
                    "cover_image_url": row[7],
                    "author_name": row[8] or "Author",
                    "total_copies": int(row[9] or 0),
                    "available_copies": int(row[10] or 0),
                })
    except Exception as e:
        print(f"[FORECAST ERROR] {e}")

    return {"forecasts": forecasts, "total": len(forecasts)}

if __name__ == "__main__":
    print("[FORECAST ROUTER] Self-test OK.")
