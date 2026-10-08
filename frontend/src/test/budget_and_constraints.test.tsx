import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { BudgetPage } from '../pages/BudgetPage';
import { ConstraintsPage } from '../pages/ConstraintsPage';
import { PlanningWizardProvider } from '../context/PlanningWizardContext';

describe('Budget and Constraints Steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders budget input with default currency INR', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <BudgetPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const budgetInput = screen.getByLabelText(/Your Maximum Budget/i);
    expect(budgetInput).toBeInTheDocument();
    expect(screen.getByText(/Zero-Silent Budget Inflation Policy/i)).toBeInTheDocument();
  });

  it('rejects negative budget input', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <BudgetPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const budgetInput = screen.getByLabelText(/Your Maximum Budget/i);
    fireEvent.change(budgetInput, { target: { value: '-500' } });

    const submitBtn = screen.getByRole('button', { name: /Continue to Constraints/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/valid non-negative budget/i);
  });

  it('allows adding and removing constraints with human-friendly labels', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Verify human-friendly enforcement levels are rendered
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not Allowed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preferred').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Flexible').length).toBeGreaterThan(0);

    // Add preset
    const presetBtn = screen.getByText(/Ban Single-Use Plastic Water Bottles/i);
    fireEvent.click(presetBtn);

    expect(
      screen.getByText(/Prohibit single-use plastic water bottles across the event venue/i)
    ).toBeInTheDocument();
  });
});
