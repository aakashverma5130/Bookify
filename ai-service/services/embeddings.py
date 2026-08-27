import os
from typing import List
# pyrefly: ignore [missing-import]
import numpy as np

class EmbeddingService:
    """
    Singleton embedding service.
    Uses all-MiniLM-L6-v2 when available; falls back to lightweight vectorizer.
    """

    def __init__(self):
        self.model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.cache_dir = os.getenv("MODEL_CACHE_DIR", None)
        self._model = None
        self._fallback_mode = False

    def load(self):
        """Load model into memory on startup."""
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[EMBEDDINGS] Loading {self.model_name}...")
            self._model = SentenceTransformer(self.model_name, cache_folder=self.cache_dir)
            print(f"[EMBEDDINGS] Model {self.model_name} ready.")
        except Exception as e:
            print(f"[EMBEDDINGS] SentenceTransformer note: {e}. Using fast local vectorizer fallback.")
            self._fallback_mode = True

    @property
    def is_loaded(self) -> bool:
        return self._model is not None or self._fallback_mode

    def encode(self, texts: List[str]) -> np.ndarray:
        """Encode list of strings into normalized vectors."""
        if self._model:
            return self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

        # Fast fallback: word & char n-gram hash vectors
        vectors = []
        for text in texts:
            vec = np.zeros(128, dtype=np.float32)
            words = text.lower().split()
            for w in words:
                idx = hash(w) % 128
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            vectors.append(vec)
        return np.array(vectors)

    def cosine_similarity(self, query_vec: np.ndarray, candidate_vecs: np.ndarray) -> np.ndarray:
        """Dot product of normalized vectors."""
        return candidate_vecs @ query_vec

embedding_service = EmbeddingService()
