from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from routers import search, recommendations, forecast
from services.embeddings import EmbeddingService

embedding_service = EmbeddingService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embedding model on startup."""
    print("[AI SERVICE] Loading embedding model...")
    embedding_service.load()
    print(f"[AI SERVICE] Model loaded: {embedding_service.model_name}")
    yield
    print("[AI SERVICE] Shutting down.")

app = FastAPI(
    title="Booksphere AI Service",
    description="Semantic search, recommendations, and demand forecasting for Booksphere",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — only the Node backend should call this
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": embedding_service.is_loaded,
        "model_name": embedding_service.model_name,
    }

app.include_router(search.router,          prefix="/ai")
app.include_router(recommendations.router, prefix="/ai")
app.include_router(forecast.router,        prefix="/ai")
