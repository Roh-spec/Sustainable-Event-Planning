from typing import Optional
from sqlalchemy.orm import Session

from backend.app.models.assumption import Assumption
from backend.app.schemas.assumption import (
    AssumptionScope,
    AssumptionSourceType,
    ResolvedAssumption,
)


class AssumptionResolver:
    """
    Core domain resolver for event planning assumptions.
    Decoupled from FastAPI; directly consumable by domain engines (Food, Waste, Water).

    Resolution Priority:
    1. Event-specific assumption (event_id = :event_id)
    2. Global reference assumption (event_id IS NULL)
    3. Missing (explicitly reported, never silently guessed)
    """

    @staticmethod
    def resolve(
        db: Session,
        parameter: str,
        event_id: Optional[int] = None,
        category: Optional[str] = None,
    ) -> ResolvedAssumption:
        """
        Resolves an assumption parameter value for a given event context.
        Returns a structured ResolvedAssumption object preserving data provenance.
        """
        cleaned_param = parameter.strip() if parameter else ""
        if not cleaned_param:
            return ResolvedAssumption(
                parameter=parameter,
                is_resolved=False,
                explanation="Missing assumption: parameter name cannot be empty.",
            )

        # 1. Search for an Event-Specific Assumption
        if event_id is not None:
            query = db.query(Assumption).filter(
                Assumption.event_id == event_id,
                Assumption.parameter == cleaned_param,
            )
            if category:
                query = query.filter(Assumption.category == category.strip())
            event_assumption = query.first()

            if event_assumption:
                return ResolvedAssumption(
                    parameter=event_assumption.parameter,
                    value=event_assumption.value,
                    unit=event_assumption.unit,
                    source_type=AssumptionSourceType(event_assumption.source_type),
                    category=event_assumption.category,
                    confidence=event_assumption.confidence,
                    reference_notes=event_assumption.reference_notes,
                    scope=AssumptionScope.EVENT,
                    is_resolved=True,
                    explanation="Estimated using an event-specific assumption.",
                )

        # 2. Search for a Global Reference Assumption
        query = db.query(Assumption).filter(
            Assumption.event_id.is_(None),
            Assumption.parameter == cleaned_param,
        )
        if category:
            query = query.filter(Assumption.category == category.strip())
        global_assumption = query.first()

        if global_assumption:
            return ResolvedAssumption(
                parameter=global_assumption.parameter,
                value=global_assumption.value,
                unit=global_assumption.unit,
                source_type=AssumptionSourceType(global_assumption.source_type),
                category=global_assumption.category,
                confidence=global_assumption.confidence,
                reference_notes=global_assumption.reference_notes,
                scope=AssumptionScope.GLOBAL,
                is_resolved=True,
                explanation="Estimated using a global reference assumption.",
            )

        # 3. Missing Assumption
        scope_context = f" for event {event_id}" if event_id is not None else " (global)"
        category_context = f" in category '{category}'" if category else ""
        return ResolvedAssumption(
            parameter=cleaned_param,
            value=None,
            unit=None,
            source_type=None,
            category=category.strip() if category else None,
            confidence=None,
            reference_notes=None,
            scope=None,
            is_resolved=False,
            explanation=f"Missing assumption: no assumption defined for parameter '{cleaned_param}'{category_context}{scope_context}.",
        )


# Alias for backwards compatibility
AssumptionManager = AssumptionResolver
