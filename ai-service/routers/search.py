# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import os

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
    Combines keyword rank (from position in candidates list) with semantic score.
    Falls back to original order if model isn't loaded.
    """
    if not embedding_service.is_loaded or not req.candidates:
        return SearchResponse(
            ranked_ids=[c.book_id for c in req.candidates],
            scores={}
        )

    # Build text representations for each candidate
    candidate_texts = [
        f"{c.title}. {c.description or ''}" for c in req.candidates
    ]

    # Encode query + candidates
    all_texts = [req.query] + candidate_texts
    all_vecs  = embedding_service.encode(all_texts)

    query_vec      = all_vecs[0]
    candidate_vecs = all_vecs[1:]

    # Cosine similarity scores (normalized vectors → dot product)
    semantic_scores = embedding_service.cosine_similarity(query_vec, candidate_vecs)

    # Keyword rank score (inverse of position: top candidate = 1.0, last = 0.0)
    n = len(req.candidates)
    keyword_scores = np.array([(n - i) / n for i in range(n)])

    # Blend
    combined = SEMANTIC_WEIGHT * semantic_scores + (1 - SEMANTIC_WEIGHT) * keyword_scores

    # Sort by combined score descending
    ranked_indices = np.argsort(combined)[::-1]
    ranked_ids     = [req.candidates[i].book_id for i in ranked_indices]
    scores_dict    = {req.candidates[i].book_id: float(combined[i]) for i in range(n)}

    return SearchResponse(ranked_ids=ranked_ids, scores=scores_dict)
