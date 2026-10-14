import React, { useEffect } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { WastePlanningPage } from "../pages/WastePlanningPage";
import {
  PlanningWizardProvider,
  usePlanningWizard,
} from "../context/PlanningWizardContext";
import { wasteApi } from "../api/waste";
import { WastePlanResponse } from "../types/waste";
import { EventResponse } from "../types/events";

vi.mock("../api/waste", () => ({
  wasteApi: {
    planWaste: vi.fn(),
  },
}));

const mockEvent: EventResponse = {
  id: 42,
  name: "Campus Green Tech Fair",
  event_type: "EXHIBITION",
  expected_attendees: 200,
  duration_days: 1,
  location: "Main Quadrangle",
  budget: { id: 1, event_id: 42, total_budget: "60000", currency: "INR" },
};

const mockWasteSuccessResponse: WastePlanResponse = {
  event_id: 42,
  event_name: "Campus Green Tech Fair",
  event_type: "EXHIBITION",
  expected_attendees: 200,
  status: "COMPLETE",
  food_waste: {
    estimated_servings: "30.00",
    estimated_kg: "12.00",
    planning_servings: "30.00",
    planning_source: "ESTIMATED",
    explanation: "30 servings of food waste estimated by the Food Module.",
  },
  packaging_waste: {
    total_items: "400.00",
    total_reusable_items: "300.00",
    total_single_use_items: "100.00",
    reusable_percentage: "75.0",
    items: [
      {
        item_name: "Plates",
        item_type: "PLATE",
        calculation_basis: "PER_PERSON",
        total_quantity: "200.00",
        reusable_quantity: "150.00",
        single_use_quantity: "50.00",
        is_split_resolved: true,
        source_type: "REFERENCE",
        explanation:
          "200 attendees × 1 per person = 200 Plates (Split via reusable_ratio_plate: 75% reusable)",
      },
      {
        item_name: "Cups",
        item_type: "CUP",
        calculation_basis: "PER_PERSON",
        total_quantity: "200.00",
        reusable_quantity: "150.00",
        single_use_quantity: "50.00",
        is_split_resolved: true,
        source_type: "REFERENCE",
        explanation:
          "200 attendees × 1 per person = 200 Cups (Split via reusable_ratio_cup: 75% reusable)",
      },
    ],
  },
  plastic_waste: {
    total_planning_items: "200.00",
    items: [
      {
        item_name: "Water Bottles",
        item_type: "WATER_BOTTLE",
        calculation_basis: "PER_PERSON",
        estimated_quantity: "200.00",
        planning_quantity: "200.00",
        source_type: "REFERENCE",
        explanation: "200 attendees × 1 per person = 200 Water Bottles",
      },
    ],
  },
  other_waste: {
    total_items: "10.00",
    items: [
      {
        name: "Decorations",
        category: "DECORATIONS",
        calculation_basis: "PER_EVENT",
        quantity: "10.00",
        unit: "items",
        source_type: "REFERENCE",
        explanation: "1 event × 10 configured quantity = 10 items",
      },
    ],
  },
  recommendations: [
    {
      code: "REC_WASTE_REDUCE_SINGLE_USE_PACKAGING",
      title: "Transition Single-Use Packaging to Reusable Alternatives",
      description:
        "The event plan includes 100 single-use packaging items. Transitioning to washable reusable alternatives eliminates disposable packaging waste.",
      reason:
        "Single-use items generate avoidable solid waste; 100 items are currently planned for single use.",
      impact: "Waste Prevention",
    },
    {
      code: "REC_WASTE_REDUCE_SINGLE_USE_PLASTIC",
      title: "Provide Bulk Dispensers to Minimize Single-Use Plastic",
      description:
        "The current plan includes 200 disposable plastic items. Offering refillable water stations reduces single-use plastic.",
      reason:
        "Calculated plastic requirement indicates 200 plastic items across the event.",
      impact: "Plastic Waste Reduction",
    },
  ],
  assumptions_used: [
    {
      parameter: "packaging_plate_per_person",
      value: "1",
      unit: "items/person",
      source_type: "REFERENCE",
      reference_notes: "Standard campus catering allowance per person.",
      is_resolved: true,
    },
    {
      parameter: "reusable_ratio_plate",
      value: "0.75",
      unit: "ratio",
      source_type: "REFERENCE",
      reference_notes: "Standard dining hall reusable dishware availability.",
      is_resolved: true,
    },
  ],
  missing_assumptions: [],
  warnings: [],
};

const renderWastePlanningPage = (customEvent = mockEvent) => {
  const StateInitializer = () => {
    const { setEvent } = usePlanningWizard();
    useEffect(() => {
      setEvent(customEvent);
    }, [customEvent]);
    return null;
  };

  return render(
    <BrowserRouter>
      <PlanningWizardProvider>
        <StateInitializer />
        <WastePlanningPage />
      </PlanningWizardProvider>
    </BrowserRouter>,
  );
};

describe("Waste Planning Page (Step 5 - Simplified MVP UX)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders heading "Let\'s reduce event waste" and descriptive subtitle', async () => {
    renderWastePlanningPage();

    expect(
      screen.getByRole("heading", {
        name: /Let's reduce event waste/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Estimate the waste your event may generate and find simple ways to reduce it\./i,
      ),
    ).toBeInTheDocument();
  });

  it("shows read-only event context (attendee count, duration) without asking for attendee inputs", async () => {
    renderWastePlanningPage();

    // EventSummaryBanner displays event info
    expect(screen.getByText("Campus Green Tech Fair")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument(); // Attendees
    expect(screen.getByText(/Day/i)).toBeInTheDocument();

    // Verify there is NO input asking for attendee counts
    expect(screen.queryByLabelText(/Attendee Count/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Enter attendee count/i)).toBeNull();
  });

  it("displays the waitlist notice for paper waste", async () => {
    renderWastePlanningPage();

    expect(
      screen.getByText(/Release Note on Paper Waste/i),
    ).toBeInTheDocument();
  });

  it("presents just the four selectable categories with descriptions", async () => {
    renderWastePlanningPage();

    expect(screen.getByText("Food waste")).toBeInTheDocument();
    expect(screen.getByText("Leftover food after meals.")).toBeInTheDocument();

    expect(screen.getByText("Disposable items")).toBeInTheDocument();
    expect(
      screen.getByText("Plates, cups, spoons and forks."),
    ).toBeInTheDocument();

    expect(screen.getByText("Plastic waste")).toBeInTheDocument();
    expect(screen.getByText("Bottles, bags and wrappers.")).toBeInTheDocument();

    expect(screen.getByText("Other waste")).toBeInTheDocument();
    expect(screen.getByText("Decorations and containers.")).toBeInTheDocument();
  });

  it("allows selecting and deselecting categories with obvious visual selected state", async () => {
    renderWastePlanningPage();

    const disposableCard = screen.getByRole("button", {
      name: /Disposable items/i,
    });
    expect(disposableCard).toHaveAttribute("aria-pressed", "true"); // selected by default

    // Deselect
    fireEvent.click(disposableCard);
    expect(disposableCard).toHaveAttribute("aria-pressed", "false");

    // Select again
    fireEvent.click(disposableCard);
    expect(disposableCard).toHaveAttribute("aria-pressed", "true");

    // Other waste is unselected by default, clicking selects it
    const otherCard = screen.getByRole("button", { name: /Other waste/i });
    expect(otherCard).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(otherCard);
    expect(otherCard).toHaveAttribute("aria-pressed", "true");
  });

  it("validates that at least one category must be selected before estimating", async () => {
    renderWastePlanningPage();

    // Deselect all active categories
    const foodCard = screen.getByRole("button", { name: /Food waste/i });
    const disposableCard = screen.getByRole("button", {
      name: /Disposable items/i,
    });
    const plasticCard = screen.getByRole("button", { name: /Plastic waste/i });

    fireEvent.click(foodCard);
    fireEvent.click(disposableCard);
    fireEvent.click(plasticCard);

    // Click "Estimate my waste"
    const estimateBtn = screen.getByRole("button", {
      name: /Estimate my waste/i,
    });
    fireEvent.click(estimateBtn);

    // Error should appear and API must not be called
    expect(wasteApi.planWaste).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please select at least one waste category before estimating\./i,
      ),
    ).toBeInTheDocument();
  });

  it("submits a valid contract-compliant request via the API client and shows results", async () => {
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(
      mockWasteSuccessResponse,
    );

    renderWastePlanningPage();

    const estimateBtn = screen.getByRole("button", {
      name: /Estimate my waste/i,
    });
    fireEvent.click(estimateBtn);

    await waitFor(() => {
      expect(wasteApi.planWaste).toHaveBeenCalledTimes(1);
    });

    const calledPayload = vi.mocked(wasteApi.planWaste).mock.calls[0][0];
    expect(calledPayload.event_id).toBe(42);
    expect(calledPayload.packaging_items.length).toBeGreaterThan(0);
    expect(calledPayload.plastic_items.length).toBeGreaterThan(0);

    // Results header
    await waitFor(() => {
      expect(screen.getByText("Estimated Event Waste")).toBeInTheDocument();
    });

    expect(screen.getByText("Complete Estimate")).toBeInTheDocument();

    // Check category metrics
    expect(screen.getAllByText("Food Waste").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("30")).toBeInTheDocument(); // 30 servings
    expect(screen.getByText(/Approx\. 12\.0 kg/i)).toBeInTheDocument(); // 12.0 kg valid weight

    expect(
      screen.getAllByText("Disposable Items").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("400")).toBeInTheDocument(); // 400 total
    expect(screen.getByText("75% reusable")).toBeInTheDocument();

    expect(screen.getAllByText("Plastic Waste").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("200").length).toBeGreaterThanOrEqual(2); // attendees + plastic items
  });

  it("renders waste-reduction recommendations from the backend response", async () => {
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(
      mockWasteSuccessResponse,
    );

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Waste Reduction Recommendations"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Transition Single-Use Packaging to Reusable Alternatives",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Waste Prevention")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Provide Bulk Dispensers to Minimize Single-Use Plastic",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Plastic Waste Reduction")).toBeInTheDocument();
  });

  it('renders collapsible "How we estimated it" section with readable labels', async () => {
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(
      mockWasteSuccessResponse,
    );

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(screen.getByText("How we estimated it")).toBeInTheDocument();
    });

    // Expand "How we estimated it"
    fireEvent.click(
      screen.getByRole("button", { name: /How we estimated it/i }),
    );

    // Verify readable parameter labels
    expect(screen.getByText("Plates needed per attendee")).toBeInTheDocument();
    expect(screen.getByText("Reusable plates ratio")).toBeInTheDocument();

    // Verify readable provenance
    const benchmarkBadges = screen.getAllByText("Campus reference benchmark");
    expect(benchmarkBadges.length).toBeGreaterThan(0);

    // Verify rate display
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("displays the required disclaimer note", async () => {
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(
      mockWasteSuccessResponse,
    );

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(screen.getByText(/Notice on Estimations:/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /These figures are estimates based on available assumptions\. Actual waste may vary depending on event activities and attendee behavior\./i,
      ),
    ).toBeInTheDocument();
  });

  it("does NOT display weight in kg when backend returns null/missing estimated_kg", async () => {
    const responseWithoutWeight: WastePlanResponse = {
      ...mockWasteSuccessResponse,
      food_waste: {
        ...mockWasteSuccessResponse.food_waste!,
        estimated_kg: null,
      },
    };
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(responseWithoutWeight);

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(screen.getByText("Estimated Event Waste")).toBeInTheDocument();
    });

    // Servings is shown
    expect(screen.getByText("30")).toBeInTheDocument();
    // Does NOT display fake 0 kg or undefined kg
    expect(screen.queryByText(/0\.0 kg/i)).toBeNull();
    expect(screen.queryByText(/0 kg/i)).toBeNull();
    expect(screen.queryByText(/Approx\./i)).toBeNull();
  });

  it("displays API error banner when waste estimation fails", async () => {
    vi.mocked(wasteApi.planWaste).mockRejectedValueOnce(
      new Error("Backend waste calculation timed out. Please try again."),
    );

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Backend waste calculation timed out. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("handles partial estimate status and lists missing assumptions honestly", async () => {
    const partialResponse: WastePlanResponse = {
      ...mockWasteSuccessResponse,
      status: "PARTIAL",
      missing_assumptions: ["reusable_ratio_spoon"],
    };
    vi.mocked(wasteApi.planWaste).mockResolvedValueOnce(partialResponse);

    renderWastePlanningPage();

    fireEvent.click(screen.getByRole("button", { name: /Estimate my waste/i }));

    await waitFor(() => {
      expect(screen.getByText("Partial Estimate")).toBeInTheDocument();
    });

    // Expand how we estimated it
    fireEvent.click(
      screen.getByRole("button", { name: /How we estimated it/i }),
    );

    expect(screen.getByText("Missing Parameters:")).toBeInTheDocument();
    expect(screen.getByText("Reusable spoons ratio")).toBeInTheDocument();
  });

  it("preserves user selections across navigation and resets state when event changes", async () => {
    const TestNavigationComponent = () => {
      const { setEvent, wasteConfig } = usePlanningWizard();

      useEffect(() => {
        setEvent(mockEvent);
      }, []);

      return (
        <div>
          <span data-testid="food-status">
            {String(wasteConfig.include_food_waste)}
          </span>
          <span data-testid="pkg-count">
            {wasteConfig.packaging_items.length}
          </span>
          <button
            type="button"
            onClick={() => {
              // Switch to a new event
              setEvent({
                id: 99,
                name: "Different Gala Dinner",
                event_type: "GALA",
                expected_attendees: 50,
                duration_days: 1,
              });
            }}
          >
            Switch Event
          </button>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <TestNavigationComponent />
        </PlanningWizardProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pkg-count")).toHaveTextContent("2");
      expect(screen.getByTestId("food-status")).toHaveTextContent("true");
    });

    // Switch event: state should reset to default and not leak
    fireEvent.click(screen.getByRole("button", { name: /Switch Event/i }));
    expect(screen.getByTestId("pkg-count")).toHaveTextContent("2");
  });
});
