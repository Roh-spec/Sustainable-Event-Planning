from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.events import router as events_router
from backend.app.api.routes.plans import router as plans_router
from backend.app.api.routes.budget import router as budget_router
from backend.app.api.routes.assumptions import router as assumptions_router
from backend.app.api.routes.planning import router as planning_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Modular, scalable backend for the AI-Based Sustainable Event Planning Assistant.",
    version="0.1.0",
    debug=settings.DEBUG,
)

# Configure Cross-Origin Resource Sharing (CORS)
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Root-level health endpoint
@app.get("/health", tags=["Health"])
def root_health():
    """Health endpoint at root."""
    return {"status": "ok"}


# API Router organization under /api/v1
api_v1_prefix = settings.API_V1_STR

app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(events_router, prefix=api_v1_prefix)
app.include_router(plans_router, prefix=api_v1_prefix)
app.include_router(budget_router, prefix=api_v1_prefix)
app.include_router(assumptions_router, prefix=api_v1_prefix)
app.include_router(planning_router, prefix=api_v1_prefix)
