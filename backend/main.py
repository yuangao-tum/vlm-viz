"""VLM-Viz FastAPI backend."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import inference
from .services.model_service import model_service
from .schemas.response import HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model at startup."""
    logger.info("Starting VLM-Viz backend...")
    try:
        await model_service.load()
    except Exception as e:
        logger.error(f"Model loading failed: {e}. Backend running without model.")
    yield
    model_service.attention_capture.remove_hooks()
    logger.info("Backend shut down.")


app = FastAPI(
    title="VLM-Viz API",
    version="1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inference.router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=model_service.model_loaded,
        model_name=model_service.model_name if model_service.model_loaded else None,
    )
