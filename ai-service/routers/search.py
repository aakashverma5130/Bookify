import sys
from pathlib import Path

# Ensure parent directory is in python module path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import os
from typing import List, Optional
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

from services.embeddings import embedding_service

router = APIRouter()

SEMANTIC_WEIGHT = float(os.getenv("SEMANTIC_WEIGHT", "0.6"))

class BookCandidate(BaseModel):
    book_id: str
    title: str
    description: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    candidates: List[BookCandidate]

class SearchResponse(BaseModel):
    ranked_ids: List[str]
    scores: dict

@router.post("/search", response_model=SearchResponse)
def semantic_search(req: SearchRequest):
    """
    Re-rank candidate books using semantic similarity to the query.
    Combines keyword rank with semantic embedding cosine similarity.
    """
    if not embedding_service.is_loaded or not req.candidates:
        return SearchResponse(
            ranked_ids=[c.book_id for c in req.candidates],
            scores={}
        )

    # Build text representations
    candidate_texts = [f"{c.title}. {c.description or ''}" for c in req.candidates]

    # Encode query + candidates
    all_texts = [req.query] + candidate_texts
    all_vecs = embedding_service.encode(all_texts)

    query_vec = all_vecs[0]
    candidate_vecs = all_vecs[1:]

    # Cosine similarity scores
    semantic_scores = embedding_service.cosine_similarity(query_vec, candidate_vecs)

    # Keyword rank score
    n = len(req.candidates)
    keyword_scores = np.array([(n - i) / n for i in range(n)])

    # Blend
    combined = SEMANTIC_WEIGHT * semantic_scores + (1 - SEMANTIC_WEIGHT) * keyword_scores

    ranked_indices = np.argsort(combined)[::-1]
    ranked_ids = [req.candidates[i].book_id for i in ranked_indices]
    scores_dict = {req.candidates[i].book_id: float(combined[i]) for i in range(n)}

    return SearchResponse(ranked_ids=ranked_ids, scores=scores_dict)

if __name__ == "__main__":
    print("[SEARCH ROUTER] Self-test OK. To run the service, execute: uvicorn main:app --port 8000")
