"""
Service-layer re-export for the Waste Planning Module orchestrator.
"""

from backend.app.planning.modules.waste.waste_planning_service import (
    WastePlanningService,
    waste_planning_service,
)

__all__ = ["WastePlanningService", "waste_planning_service"]
