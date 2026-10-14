import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  MainPriority,
  PRIORITY_OBJECTIVE_MAP,
  PlanningObjective,
  FoodPlanResponse,
  WastePlanResponse,
  CompletePlanResponse,
} from "../types";
import { eventsApi } from "../api/events";
import { planningApi, PlanSelectionResult } from "../api/planning";

export interface FoodConfigState {
  meals: MealInput[];
  default_dietary_preference: DietaryPreference;
  vegetarian_ratio: string;
  budgetMode: "ESTIMATE" | "ENTER";
  food_budget: string;
  costApproach: "ESTIMATE" | "UNIT" | "TOTAL";
  known_unit_cost: string;
  known_total_cost: string;
  cost_pricing_unit: FoodPricingUnit;
}

export interface WasteConfigState {
  include_food_waste: boolean;
  food_waste_override_servings?: string;
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

  // Priority
  priority: MainPriority;
  setPriority: (priority: MainPriority) => void;

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
  foodPlanResponse: FoodPlanResponse | null;
  setFoodPlanResponse: (response: FoodPlanResponse | null) => void;

  // Waste
  wasteConfig: WasteConfigState;
  setWasteConfig: React.Dispatch<React.SetStateAction<WasteConfigState>>;
  addPackagingItem: (item: PackagingItemInput) => void;
  removePackagingItem: (index: number) => void;
  addPlasticItem: (item: PlasticItemInput) => void;
  removePlasticItem: (index: number) => void;
  addOtherWasteItem: (item: OtherWasteItemInput) => void;
  removeOtherWasteItem: (index: number) => void;
  wastePlanResponse: WastePlanResponse | null;
  setWastePlanResponse: (response: WastePlanResponse | null) => void;

  // Plans & Generation
  planningResponse: PlanningResponse | null;
  setPlanningResponse: (response: PlanningResponse | null) => void;
  isGenerating: boolean;
  generationError: string | null;
  generatePlans: (
    overrideBudgetApproval?: boolean,
    maxApprovedBudget?: string,
  ) => Promise<PlanningResponse>;

  // Selection
  selectedPlan: PlanAlternative | null;
  selectPlan: (plan: PlanAlternative) => Promise<PlanSelectionResult>;

  // Complete Plan (Step 7)
  completePlan: CompletePlanResponse | null;
  setCompletePlan: (plan: CompletePlanResponse | null) => void;
  timingConfig: { eventDate: string; startTime: string; endTime: string };
  setTimingConfig: React.Dispatch<
    React.SetStateAction<{
      eventDate: string;
      startTime: string;
      endTime: string;
    }>
  >;

  // Reset
  resetWizard: () => void;
}

const defaultFoodConfig: FoodConfigState = {
  meals: [
    {
      meal_type: "LUNCH",
      name: "Main Lunch",
      day: 1,
      dietary_preference: "MIXED",
    },
  ],
  default_dietary_preference: "MIXED",
  vegetarian_ratio: "0.70",
  budgetMode: "ESTIMATE",
  food_budget: "",
  costApproach: "ESTIMATE",
  known_unit_cost: "",
  known_total_cost: "",
  cost_pricing_unit: "PER_PERSON",
};

const defaultWasteConfig: WasteConfigState = {
  include_food_waste: true,
  food_waste_override_servings: "",
  packaging_items: [
    {
      item_type: "PLATE",
      calculation_basis: "PER_PERSON",
    },
    {
      item_type: "CUP",
      calculation_basis: "PER_PERSON",
    },
  ],
  plastic_items: [
    {
      item_type: "WATER_BOTTLE",
      calculation_basis: "PER_PERSON",
    },
  ],
  other_waste_items: [],
};

const PlanningWizardContext = createContext<
  PlanningWizardContextType | undefined
>(undefined);

export const PlanningWizardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [event, setEventState] = useState<EventResponse | null>(() => {
    const saved = sessionStorage.getItem("wizard_event");
    return saved ? JSON.parse(saved) : null;
  });

  const [budget, setBudget] = useState<{
    total_budget: string;
    currency: string;
  }>(() => {
    const saved = sessionStorage.getItem("wizard_budget");
    return saved
      ? JSON.parse(saved)
      : { total_budget: "50000", currency: "INR" };
  });

  const [priority, setPriority] = useState<MainPriority>(() => {
    const saved = sessionStorage.getItem("wizard_priority");
    return (saved as MainPriority) || "BALANCED";
  });

  const [constraints, setConstraints] = useState<ConstraintBase[]>(() => {
    const saved = sessionStorage.getItem("wizard_constraints");
    return saved ? JSON.parse(saved) : [];
  });

  const [foodConfig, setFoodConfig] = useState<FoodConfigState>(() => {
    const saved = sessionStorage.getItem("wizard_food_config");
    return saved
      ? { ...defaultFoodConfig, ...JSON.parse(saved) }
      : defaultFoodConfig;
  });

  const [foodPlanResponse, setFoodPlanResponse] =
    useState<FoodPlanResponse | null>(() => {
      const saved = sessionStorage.getItem("wizard_food_plan_response");
      return saved ? JSON.parse(saved) : null;
    });

  const [wasteConfig, setWasteConfig] = useState<WasteConfigState>(() => {
    const saved = sessionStorage.getItem("wizard_waste_config");
    return saved ? JSON.parse(saved) : defaultWasteConfig;
  });

  const [wastePlanResponse, setWastePlanResponse] =
    useState<WastePlanResponse | null>(() => {
      const saved = sessionStorage.getItem("wizard_waste_plan_response");
      return saved ? JSON.parse(saved) : null;
    });

  const [planningResponse, setPlanningResponse] =
    useState<PlanningResponse | null>(() => {
      const saved = sessionStorage.getItem("wizard_planning_response");
      return saved ? JSON.parse(saved) : null;
    });

  const [selectedPlan, setSelectedPlan] = useState<PlanAlternative | null>(
    () => {
      const saved = sessionStorage.getItem("wizard_selected_plan");
      return saved ? JSON.parse(saved) : null;
    },
  );

  const [completePlan, setCompletePlan] = useState<CompletePlanResponse | null>(
    () => {
      const saved = sessionStorage.getItem("wizard_complete_plan");
      return saved ? JSON.parse(saved) : null;
    },
  );

  const [timingConfig, setTimingConfig] = useState<{
    eventDate: string;
    startTime: string;
    endTime: string;
  }>(() => {
    const saved = sessionStorage.getItem("wizard_timing_config");
    return saved
      ? JSON.parse(saved)
      : { eventDate: "", startTime: "09:00", endTime: "17:00" };
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Sync to session storage to survive refreshes
  useEffect(() => {
    if (event) sessionStorage.setItem("wizard_event", JSON.stringify(event));
  }, [event]);

  useEffect(() => {
    sessionStorage.setItem("wizard_budget", JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    sessionStorage.setItem("wizard_priority", priority);
  }, [priority]);

  useEffect(() => {
    sessionStorage.setItem("wizard_constraints", JSON.stringify(constraints));
  }, [constraints]);

  useEffect(() => {
    sessionStorage.setItem("wizard_food_config", JSON.stringify(foodConfig));
  }, [foodConfig]);

  useEffect(() => {
    if (foodPlanResponse)
      sessionStorage.setItem(
        "wizard_food_plan_response",
        JSON.stringify(foodPlanResponse),
      );
    else sessionStorage.removeItem("wizard_food_plan_response");
  }, [foodPlanResponse]);

  useEffect(() => {
    sessionStorage.setItem("wizard_waste_config", JSON.stringify(wasteConfig));
  }, [wasteConfig]);

  useEffect(() => {
    if (wastePlanResponse)
      sessionStorage.setItem(
        "wizard_waste_plan_response",
        JSON.stringify(wastePlanResponse),
      );
    else sessionStorage.removeItem("wizard_waste_plan_response");
  }, [wastePlanResponse]);

  useEffect(() => {
    if (planningResponse)
      sessionStorage.setItem(
        "wizard_planning_response",
        JSON.stringify(planningResponse),
      );
  }, [planningResponse]);

  useEffect(() => {
    if (selectedPlan)
      sessionStorage.setItem(
        "wizard_selected_plan",
        JSON.stringify(selectedPlan),
      );
  }, [selectedPlan]);

  useEffect(() => {
    if (completePlan)
      sessionStorage.setItem(
        "wizard_complete_plan",
        JSON.stringify(completePlan),
      );
    else sessionStorage.removeItem("wizard_complete_plan");
  }, [completePlan]);

  useEffect(() => {
    sessionStorage.setItem(
      "wizard_timing_config",
      JSON.stringify(timingConfig),
    );
  }, [timingConfig]);

  const setEvent = (newEvent: EventResponse | null) => {
    if (newEvent) {
      const storedEventId = sessionStorage.getItem("wizard_event_id");
      if (storedEventId && storedEventId !== String(newEvent.id)) {
        // Event changed: reset module configs so new event doesn't inherit stale values
        setFoodConfig(defaultFoodConfig);
        setFoodPlanResponse(null);
        setWasteConfig(defaultWasteConfig);
        setWastePlanResponse(null);
        setPlanningResponse(null);
        setSelectedPlan(null);
        setCompletePlan(null);
        sessionStorage.removeItem("wizard_food_config");
        sessionStorage.removeItem("wizard_food_plan_response");
        sessionStorage.removeItem("wizard_waste_config");
        sessionStorage.removeItem("wizard_waste_plan_response");
        sessionStorage.removeItem("wizard_planning_response");
        sessionStorage.removeItem("wizard_selected_plan");
        sessionStorage.removeItem("wizard_complete_plan");
      }
      sessionStorage.setItem("wizard_event_id", String(newEvent.id));
    } else {
      sessionStorage.removeItem("wizard_event_id");
    }
    setEventState(newEvent);
  };

  const loadEvent = async (eventId: number): Promise<EventResponse> => {
    const storedEventId = sessionStorage.getItem("wizard_event_id");
    const isDifferentEvent = storedEventId !== String(eventId);

    if (event && event.id === eventId && !isDifferentEvent) return event;

    const fetched = await eventsApi.getById(eventId);
    setEventState(fetched);

    if (isDifferentEvent) {
      // Clear stale wizard state from previous event
      sessionStorage.setItem("wizard_event_id", String(eventId));
      sessionStorage.setItem("wizard_event", JSON.stringify(fetched));
      setFoodConfig(defaultFoodConfig);
      setFoodPlanResponse(null);
      setWasteConfig(defaultWasteConfig);
      setWastePlanResponse(null);
      setPlanningResponse(null);
      setSelectedPlan(null);
      setCompletePlan(null);
      sessionStorage.removeItem("wizard_food_config");
      sessionStorage.removeItem("wizard_food_plan_response");
      sessionStorage.removeItem("wizard_waste_config");
      sessionStorage.removeItem("wizard_waste_plan_response");
      sessionStorage.removeItem("wizard_planning_response");
      sessionStorage.removeItem("wizard_selected_plan");
      sessionStorage.removeItem("wizard_complete_plan");
    }

    if (fetched.budget?.total_budget) {
      setBudget({
        total_budget: String(fetched.budget.total_budget),
        currency: fetched.budget.currency || "INR",
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
    maxApprovedBudget?: string,
  ): Promise<PlanningResponse> => {
    if (!event) {
      throw new Error(
        "No active event found. Please create or select an event first.",
      );
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const mappedObjective = PRIORITY_OBJECTIVE_MAP[priority] || "BALANCED";
      const planningObjectives: PlanningObjective[] =
        priority === "BALANCED"
          ? ["BALANCED", "BUDGET_FOCUSED", "SUSTAINABILITY_FOCUSED"]
          : [mappedObjective];

      // Build clean request payload matching PlanningRequest backend schema exactly
      const requestPayload: PlanningRequest = {
        event_id: event.id,
        budget: budget.total_budget ? Number(budget.total_budget) : undefined,
        constraints: constraints.length > 0 ? constraints : undefined,
        planning_objectives: planningObjectives,
        allow_budget_increase: overrideBudgetApproval ?? false,
        max_approved_budget: maxApprovedBudget
          ? Number(maxApprovedBudget)
          : undefined,
        module_context: {
          food: {
            event_id: event.id,
            meals: foodConfig.meals,
            default_dietary_preference: foodConfig.default_dietary_preference,
            vegetarian_ratio: foodConfig.vegetarian_ratio
              ? Number(foodConfig.vegetarian_ratio)
              : undefined,
            food_budget:
              foodConfig.budgetMode === "ENTER" && foodConfig.food_budget
                ? Number(foodConfig.food_budget)
                : undefined,
            known_unit_cost:
              foodConfig.costApproach === "UNIT" &&
              foodConfig.known_unit_cost &&
              Number(foodConfig.known_unit_cost) > 0
                ? Number(foodConfig.known_unit_cost)
                : undefined,
            known_total_cost:
              foodConfig.costApproach === "TOTAL" &&
              foodConfig.known_total_cost &&
              Number(foodConfig.known_total_cost) > 0
                ? Number(foodConfig.known_total_cost)
                : undefined,
            cost_pricing_unit:
              foodConfig.costApproach === "UNIT"
                ? foodConfig.cost_pricing_unit
                : undefined,
          },
          waste: {
            event_id: event.id,
            food_waste: wasteConfig.include_food_waste
              ? {
                  food_plan_request: {
                    event_id: event.id,
                    meals: foodConfig.meals,
                    default_dietary_preference:
                      foodConfig.default_dietary_preference,
                    vegetarian_ratio: foodConfig.vegetarian_ratio
                      ? Number(foodConfig.vegetarian_ratio)
                      : undefined,
                  },
                  user_override_servings:
                    wasteConfig.food_waste_override_servings &&
                    Number(wasteConfig.food_waste_override_servings) > 0
                      ? Number(wasteConfig.food_waste_override_servings)
                      : undefined,
                }
              : undefined,
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
      const msg =
        err.message ||
        "Failed to generate plans. Please check your inputs and try again.";
      setGenerationError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPlan = async (
    plan: PlanAlternative,
  ): Promise<PlanSelectionResult> => {
    if (!event) {
      throw new Error("No active event associated with plan selection.");
    }
    const result = await planningApi.selectPlan(event.id, plan);
    setSelectedPlan(plan);
    return result;
  };

  const resetWizard = () => {
    setEvent(null);
    setBudget({ total_budget: "50000", currency: "INR" });
    setPriority("BALANCED");
    setConstraints([]);
    setFoodConfig(defaultFoodConfig);
    setFoodPlanResponse(null);
    setWasteConfig(defaultWasteConfig);
    setWastePlanResponse(null);
    setPlanningResponse(null);
    setSelectedPlan(null);
    setCompletePlan(null);
    setTimingConfig({ eventDate: "", startTime: "09:00", endTime: "17:00" });
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
        priority,
        setPriority,
        constraints,
        setConstraints,
        addConstraint,
        removeConstraint,
        foodConfig,
        setFoodConfig,
        addMeal,
        removeMeal,
        foodPlanResponse,
        setFoodPlanResponse,
        wasteConfig,
        setWasteConfig,
        addPackagingItem,
        removePackagingItem,
        addPlasticItem,
        removePlasticItem,
        addOtherWasteItem,
        removeOtherWasteItem,
        wastePlanResponse,
        setWastePlanResponse,
        planningResponse,
        setPlanningResponse,
        isGenerating,
        generationError,
        generatePlans,
        selectedPlan,
        selectPlan,
        completePlan,
        setCompletePlan,
        timingConfig,
        setTimingConfig,
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
    throw new Error(
      "usePlanningWizard must be used within a PlanningWizardProvider",
    );
  }
  return context;
};
