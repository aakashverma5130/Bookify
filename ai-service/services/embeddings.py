# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
import os
# pyrefly: ignore [missing-import]
import numpy as np
from typing import List

class EmbeddingService:
    """
    Singleton-style embedding service.
    Loads all-MiniLM-L6-v2 once on startup; reused across all requests.
    """

    def __init__(self):
        self.model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.cache_dir  = os.getenv("MODEL_CACHE_DIR", None)
        self._model     = None

    def load(self):
        """Load the model into memory. Called once during FastAPI lifespan startup."""
        self._model = SentenceTransformer(self.model_name, cache_folder=self.cache_dir)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def encode(self, texts: List[str]) -> np.ndarray:
        """Encode a list of strings into embedding vectors."""
        if not self._model:
            raise RuntimeError("Embedding model not loaded. Call load() first.")
        return self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

    def cosine_similarity(self, query_vec: np.ndarray, candidate_vecs: np.ndarray) -> np.ndarray:
        """
        Compute cosine similarity between one query vector and N candidate vectors.
        Since encode() normalizes, this is just a dot product.
        Returns array of shape (N,).
        """
        return candidate_vecs @ query_vec


# Module-level singleton — imported by main.py and routers
embedding_service = EmbeddingService()
