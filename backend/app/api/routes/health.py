from typing import Dict
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=Dict[str, str])
def get_health() -> Dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "ok"}
