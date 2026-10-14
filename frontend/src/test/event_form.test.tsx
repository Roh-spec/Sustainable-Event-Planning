import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { EventCreationPage } from "../pages/EventCreationPage";
import { PlanningWizardProvider } from "../context/PlanningWizardContext";
import { eventsApi } from "../api/events";

vi.mock("../api/events", () => ({
  eventsApi: {
    create: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
  },
}));

describe("EventCreationPage Form Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <EventCreationPage />
        </PlanningWizardProvider>
      </BrowserRouter>,
    );
  };

  it("renders required event fields", () => {
    renderComponent();
    expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected Attendees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  it("rejects empty event name submission", async () => {
    renderComponent();
    const nameInput = screen.getByLabelText(/Event Name/i);
    fireEvent.change(nameInput, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", {
      name: /Continue to Budget Step/i,
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Event Name is required/i,
    );
    expect(eventsApi.create).not.toHaveBeenCalled();
  });

  it("rejects attendees <= 0", async () => {
    renderComponent();
    const nameInput = screen.getByLabelText(/Event Name/i);
    const attendeesInput = screen.getByLabelText(/Expected Attendees/i);

    fireEvent.change(nameInput, {
      target: { value: "Annual College Hackathon" },
    });
    fireEvent.change(attendeesInput, { target: { value: "0" } });

    const submitBtn = screen.getByRole("button", {
      name: /Continue to Budget Step/i,
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Attendees must be a positive integer/i,
    );
    expect(eventsApi.create).not.toHaveBeenCalled();
  });

  it("submits valid event and calls eventsApi.create", async () => {
    (eventsApi.create as any).mockResolvedValueOnce({
      id: 42,
      name: "Green Tech Fest 2026",
      event_type: "TECH_FEST",
      expected_attendees: 200,
      duration_days: 2,
      location: "Main Auditorium",
      budget: { total_budget: "50000", currency: "INR" },
    });

    renderComponent();
    const nameInput = screen.getByLabelText(/Event Name/i);
    const attendeesInput = screen.getByLabelText(/Expected Attendees/i);
    const durationInput = screen.getByLabelText(/Duration/i);

    fireEvent.change(nameInput, { target: { value: "Green Tech Fest 2026" } });
    fireEvent.change(attendeesInput, { target: { value: "200" } });
    fireEvent.change(durationInput, { target: { value: "2" } });

    const submitBtn = screen.getByRole("button", {
      name: /Continue to Budget Step/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(eventsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Green Tech Fest 2026",
          event_type: "TECH_FEST",
          expected_attendees: 200,
          duration_days: 2,
        }),
      );
    });
  });
});
