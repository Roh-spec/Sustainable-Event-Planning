"""
Data sources and loader interfaces for baseline domain assumptions.
Defines provenance categories and interfaces for future configuration loaders and ML predictors.
"""

from dataclasses import dataclass
from typing import Optional
from backend.app.schemas.assumption import AssumptionSourceType


@dataclass(frozen=True)
class AssumptionSourceDefinition:
    """Metadata descriptor for an assumption origin."""
    name: str
    source_type: AssumptionSourceType
    description: str
    is_authoritative: bool = False


# Supported provenance categories recognized by the assumption system
STANDARD_SOURCES = {
    AssumptionSourceType.USER_PROVIDED: AssumptionSourceDefinition(
        name="Organizer Input",
        source_type=AssumptionSourceType.USER_PROVIDED,
        description="Explicitly provided by the event organizer. Highest precedence.",
        is_authoritative=True,
    ),
    AssumptionSourceType.REFERENCE: AssumptionSourceDefinition(
        name="Empirical Benchmark",
        source_type=AssumptionSourceType.REFERENCE,
        description="Verified institutional guidelines or published green event standards.",
        is_authoritative=True,
    ),
    AssumptionSourceType.ASSUMED: AssumptionSourceDefinition(
        name="System Heuristic",
        source_type=AssumptionSourceType.ASSUMED,
        description="Standard baseline heuristic when specific measurements are omitted.",
        is_authoritative=False,
    ),
    AssumptionSourceType.ACTUAL: AssumptionSourceDefinition(
        name="Post-Event Measurement",
        source_type=AssumptionSourceType.ACTUAL,
        description="Audited measurement recorded after event conclusion.",
        is_authoritative=True,
    ),
    AssumptionSourceType.ML_PREDICTED: AssumptionSourceDefinition(
        name="Statistical Inference",
        source_type=AssumptionSourceType.ML_PREDICTED,
        description="Predictive model estimation based on historical event characteristics.",
        is_authoritative=False,
    ),
}
