import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  EventResponse,
  ConstraintBase,
  MealInput,
  DietaryPreference,
  FoodPricingUnit,
  PackagingItemInput,
  PlasticItemInput,
  OtherWasteItemInput,
  PlanningResponse,
  PlanAlternative,
  PlanningRequest,
} from '../types';
import { eventsApi } from '../api/events';
import { planningApi, PlanSelectionResult } from '../api/planning';

export interface FoodConfigState {
  meals: MealInput[];
  default_dietary_preference: DietaryPreference;
  vegetarian_ratio: string;
  costApproach: 'ESTIMATE' | 'UNIT' | 'TOTAL';
  known_unit_cost: string;
  known_total_cost: string;
  cost_pricing_unit: FoodPricingUnit;
}

export interface WasteConfigState {
  packaging_items: PackagingItemInput[];
  plastic_items: PlasticItemInput[];
  other_waste_items: OtherWasteItemInput[];
}

interface PlanningWizardContextType {
  event: EventResponse | null;
  setEvent: (event: EventResponse | null) => void;
  loadEvent: (eventId: number) => Promise<EventResponse>;

  // Budget
  budget: { total_budget: string; currency: string };
  setBudget: (budget: { total_budget: string; currency: string }) => void;

  // Constraints
  constraints: ConstraintBase[];
  setConstraints: React.Dispatch<React.SetStateAction<ConstraintBase[]>>;
  addConstraint: (constraint: ConstraintBase) => void;
  removeConstraint: (index: number) => void;

  // Food
  foodConfig: FoodConfigState;
  setFoodConfig: React.Dispatch<React.SetStateAction<FoodConfigState>>;
  addMeal: (meal: MealInput) => void;
  removeMeal: (index: number) => void;

  // Waste
  wasteConfig: WasteConfigState;
  setWasteConfig: React.Dispatch<React.SetStateAction<WasteConfigState>>;
  addPackagingItem: (item: PackagingItemInput) => void;
  removePackagingItem: (index: number) => void;
  addPlasticItem: (item: PlasticItemInput) => void;
  removePlasticItem: (index: number) => void;
  addOtherWasteItem: (item: OtherWasteItemInput) => void;
  removeOtherWasteItem: (index: number) => void;

  // Plans & Generation
  planningResponse: PlanningResponse | null;
  setPlanningResponse: (response: PlanningResponse | null) => void;
  isGenerating: boolean;
  generationError: string | null;
  generatePlans: (overrideBudgetApproval?: boolean, maxApprovedBudget?: string) => Promise<PlanningResponse>;

  // Selection
  selectedPlan: PlanAlternative | null;
  selectPlan: (plan: PlanAlternative) => Promise<PlanSelectionResult>;

  // Reset
  resetWizard: () => void;
}

const defaultFoodConfig: FoodConfigState = {
  meals: [
    {
      meal_type: 'LUNCH',
      name: 'Main Lunch',
      day: 1,
      dietary_preference: 'MIXED',
    },
  ],
  default_dietary_preference: 'MIXED',
  vegetarian_ratio: '0.70',
  costApproach: 'ESTIMATE',
  known_unit_cost: '',
  known_total_cost: '',
  cost_pricing_unit: 'PER_PERSON',
};

const defaultWasteConfig: WasteConfigState = {
  packaging_items: [
    {
      item_type: 'PLATE',
      calculation_basis: 'PER_PERSON',
    },
    {
      item_type: 'CUP',
      calculation_basis: 'PER_PERSON',
    },
  ],
  plastic_items: [
    {
      item_type: 'WATER_BOTTLE',
      calculation_basis: 'PER_PERSON',
    },
  ],
  other_waste_items: [],
};

const PlanningWizardContext = createContext<PlanningWizardContextType | undefined>(undefined);

export const PlanningWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<EventResponse | null>(() => {
    const saved = sessionStorage.getItem('wizard_event');
    return saved ? JSON.parse(saved) : null;
  });

  const [budget, setBudget] = useState<{ total_budget: string; currency: string }>(() => {
    const saved = sessionStorage.getItem('wizard_budget');
    return saved ? JSON.parse(saved) : { total_budget: '50000', currency: 'INR' };
  });

  const [constraints, setConstraints] = useState<ConstraintBase[]>(() => {
    const saved = sessionStorage.getItem('wizard_constraints');
    return saved
      ? JSON.parse(saved)
      : [
          {
            category: 'FOOD',
            description: 'Vegetarian meals provided for all dietary preferences',
            constraint_type: 'REQUIRED',
            value: 'VEGETARIAN_OPTIONS',
          },
          {
            category: 'WASTE',
            description: 'Prefer reusable plates and cups over disposable packaging',
            constraint_type: 'PREFERRED',
            value: 'REUSABLE_PACKAGING',
          },
        ];
  });

  const [foodConfig, setFoodConfig] = useState<FoodConfigState>(() => {
    const saved = sessionStorage.getItem('wizard_food_config');
    return saved ? JSON.parse(saved) : defaultFoodConfig;
  });

  const [wasteConfig, setWasteConfig] = useState<WasteConfigState>(() => {
    const saved = sessionStorage.getItem('wizard_waste_config');
    return saved ? JSON.parse(saved) : defaultWasteConfig;
  });

  const [planningResponse, setPlanningResponse] = useState<PlanningResponse | null>(() => {
    const saved = sessionStorage.getItem('wizard_planning_response');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedPlan, setSelectedPlan] = useState<PlanAlternative | null>(() => {
    const saved = sessionStorage.getItem('wizard_selected_plan');
    return saved ? JSON.parse(saved) : null;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Sync to session storage to survive refreshes
  useEffect(() => {
    if (event) sessionStorage.setItem('wizard_event', JSON.stringify(event));
  }, [event]);

  useEffect(() => {
    sessionStorage.setItem('wizard_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    sessionStorage.setItem('wizard_constraints', JSON.stringify(constraints));
  }, [constraints]);

  useEffect(() => {
    sessionStorage.setItem('wizard_food_config', JSON.stringify(foodConfig));
  }, [foodConfig]);

  useEffect(() => {
    sessionStorage.setItem('wizard_waste_config', JSON.stringify(wasteConfig));
  }, [wasteConfig]);

  useEffect(() => {
    if (planningResponse) sessionStorage.setItem('wizard_planning_response', JSON.stringify(planningResponse));
  }, [planningResponse]);

  useEffect(() => {
    if (selectedPlan) sessionStorage.setItem('wizard_selected_plan', JSON.stringify(selectedPlan));
  }, [selectedPlan]);

  const loadEvent = async (eventId: number): Promise<EventResponse> => {
    if (event && event.id === eventId) return event;
    const fetched = await eventsApi.getById(eventId);
    setEvent(fetched);
    if (fetched.budget?.total_budget) {
      setBudget({
        total_budget: String(fetched.budget.total_budget),
        currency: fetched.budget.currency || 'INR',
      });
    }
    return fetched;
  };

  const addConstraint = (constraint: ConstraintBase) => {
    setConstraints((prev) => [...prev, constraint]);
  };

  const removeConstraint = (index: number) => {
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  };

  const addMeal = (meal: MealInput) => {
    setFoodConfig((prev) => ({
      ...prev,
      meals: [...prev.meals, meal],
    }));
  };

  const removeMeal = (index: number) => {
    setFoodConfig((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index),
    }));
  };

  const addPackagingItem = (item: PackagingItemInput) => {
    setWasteConfig((prev) => ({
      ...prev,
      packaging_items: [...prev.packaging_items, item],
    }));
  };

  const removePackagingItem = (index: number) => {
    setWasteConfig((prev) => ({
      ...prev,
      packaging_items: prev.packaging_items.filter((_, i) => i !== index),
    }));
  };

  const addPlasticItem = (item: PlasticItemInput) => {
    setWasteConfig((prev) => ({
      ...prev,
      plastic_items: [...prev.plastic_items, item],
    }));
  };

  const removePlasticItem = (index: number) => {
    setWasteConfig((prev) => ({
      ...prev,
      plastic_items: prev.plastic_items.filter((_, i) => i !== index),
    }));
  };

  const addOtherWasteItem = (item: OtherWasteItemInput) => {
    setWasteConfig((prev) => ({
      ...prev,
      other_waste_items: [...prev.other_waste_items, item],
    }));
  };

  const removeOtherWasteItem = (index: number) => {
    setWasteConfig((prev) => ({
      ...prev,
      other_waste_items: prev.other_waste_items.filter((_, i) => i !== index),
    }));
  };

  const generatePlans = async (
    overrideBudgetApproval?: boolean,
    maxApprovedBudget?: string
  ): Promise<PlanningResponse> => {
    if (!event) {
      throw new Error('No active event found. Please create or select an event first.');
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Build clean request payload matching PlanningRequest backend schema exactly
      const requestPayload: PlanningRequest = {
        event_id: event.id,
        budget: budget.total_budget ? Number(budget.total_budget) : undefined,
        constraints: constraints.length > 0 ? constraints : undefined,
        allow_budget_increase: overrideBudgetApproval ?? false,
        max_approved_budget: maxApprovedBudget ? Number(maxApprovedBudget) : undefined,
        module_context: {
          food: {
            event_id: event.id,
            meals: foodConfig.meals,
            default_dietary_preference: foodConfig.default_dietary_preference,
            vegetarian_ratio: foodConfig.vegetarian_ratio ? Number(foodConfig.vegetarian_ratio) : undefined,
            known_unit_cost:
              foodConfig.costApproach === 'UNIT' && foodConfig.known_unit_cost
                ? Number(foodConfig.known_unit_cost)
                : undefined,
            known_total_cost:
              foodConfig.costApproach === 'TOTAL' && foodConfig.known_total_cost
                ? Number(foodConfig.known_total_cost)
                : undefined,
            cost_pricing_unit: foodConfig.costApproach === 'UNIT' ? foodConfig.cost_pricing_unit : undefined,
          },
          waste: {
            event_id: event.id,
            packaging_items: wasteConfig.packaging_items,
            plastic_items: wasteConfig.plastic_items,
            other_waste_items: wasteConfig.other_waste_items,
          },
        },
      };

      const response = await planningApi.generate(requestPayload);
      setPlanningResponse(response);
      return response;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate plans. Please check your inputs and try again.';
      setGenerationError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPlan = async (plan: PlanAlternative): Promise<PlanSelectionResult> => {
    if (!event) {
      throw new Error('No active event associated with plan selection.');
    }
    const result = await planningApi.selectPlan(event.id, plan);
    setSelectedPlan(plan);
    return result;
  };

  const resetWizard = () => {
    setEvent(null);
    setBudget({ total_budget: '50000', currency: 'INR' });
    setConstraints([]);
    setFoodConfig(defaultFoodConfig);
    setWasteConfig(defaultWasteConfig);
    setPlanningResponse(null);
    setSelectedPlan(null);
    sessionStorage.clear();
  };

  return (
    <PlanningWizardContext.Provider
      value={{
        event,
        setEvent,
        loadEvent,
        budget,
        setBudget,
        constraints,
        setConstraints,
        addConstraint,
        removeConstraint,
        foodConfig,
        setFoodConfig,
        addMeal,
        removeMeal,
        wasteConfig,
        setWasteConfig,
        addPackagingItem,
        removePackagingItem,
        addPlasticItem,
        removePlasticItem,
        addOtherWasteItem,
        removeOtherWasteItem,
        planningResponse,
        setPlanningResponse,
        isGenerating,
        generationError,
        generatePlans,
        selectedPlan,
        selectPlan,
        resetWizard,
      }}
    >
      {children}
    </PlanningWizardContext.Provider>
  );
};

export const usePlanningWizard = (): PlanningWizardContextType => {
  const context = useContext(PlanningWizardContext);
  if (!context) {
    throw new Error('usePlanningWizard must be used within a PlanningWizardProvider');
  }
  return context;
};
