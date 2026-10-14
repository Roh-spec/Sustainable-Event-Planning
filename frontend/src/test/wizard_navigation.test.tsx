import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import {
  PlanningWizardProvider,
  usePlanningWizard,
} from "../context/PlanningWizardContext";
import { EventResponse } from "../types/events";

describe("Wizard Navigation & State Preservation", () => {
  const mockEvent: EventResponse = {
    id: 10,
    name: "National Innovation Summit",
    event_type: "CONFERENCE",
    expected_attendees: 300,
    duration_days: 2,
    location: "Auditorium Hall A",
    budget: { id: 1, event_id: 10, total_budget: "75000", currency: "INR" },
  };

  it("renders all 7 wizard steps with proper progress indicator", () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <WizardProgress currentStep={3} eventId={10} />
        </PlanningWizardProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Waste")).toBeInTheDocument();
    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(screen.getByText("Complete Event Plan")).toBeInTheDocument();
  });

  it("EventSummaryBanner displays attendee count, duration, and budget limit", () => {
    render(
      <BrowserRouter>
        <EventSummaryBanner
          event={mockEvent}
          budget={{ total_budget: "75000", currency: "INR" }}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("National Innovation Summit")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Days/i)).toBeInTheDocument();
    expect(screen.getByText("Auditorium Hall A")).toBeInTheDocument();
    expect(screen.getByText(/Budget: ₹75,000/i)).toBeInTheDocument();
  });

  it("preserves form state in context when navigating backwards and forwards", () => {
    const TestComponent = () => {
      const { budget, setBudget, constraints, addConstraint } =
        usePlanningWizard();
      return (
        <div>
          <span data-testid="budget-val">{budget.total_budget}</span>
          <span data-testid="constraint-count">{constraints.length}</span>
          <button
            type="button"
            onClick={() => {
              setBudget({ total_budget: "95000", currency: "INR" });
              addConstraint({
                category: "FOOD",
                description: "Vegan dessert",
                constraint_type: "PREFERRED",
              });
            }}
          >
            Update State
          </button>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <TestComponent />
        </PlanningWizardProvider>
      </BrowserRouter>,
    );

    const updateBtn = screen.getByRole("button", { name: /Update State/i });
    fireEvent.click(updateBtn);

    expect(screen.getByTestId("budget-val")).toHaveTextContent("95000");
    expect(
      Number(screen.getByTestId("constraint-count").textContent),
    ).toBeGreaterThan(0);
  });
});
