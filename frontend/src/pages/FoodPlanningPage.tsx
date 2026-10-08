import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import {
  MealType,
  DietaryPreference,
  FoodPricingUnit,
  MEAL_TYPE_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  FoodPlanResponse,
} from '../types/food';
import { foodApi } from '../api/food';
import { ExplainableMetric } from '../components/sustainability/ExplainableMetric';

export const FoodPlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    foodConfig,
    setFoodConfig,
    addMeal,
    removeMeal,
  } = usePlanningWizard();

  const [newMealType, setNewMealType] = useState<MealType>('LUNCH');
  const [newMealName, setNewMealName] = useState('');
  const [newMealDay, setNewMealDay] = useState(1);
  const [newMealDiet, setNewMealDiet] = useState<DietaryPreference>('MIXED');
  const [previewResult, setPreviewResult] = useState<FoodPlanResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) => setError(`Failed to load event: ${err.message}`));
    }
  }, [eventId]);

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    addMeal({
      meal_type: newMealType,
      name: newMealName.trim() || undefined,
      day: newMealDay,
      dietary_preference: newMealDiet,
    });
    setNewMealName('');
  };

  const handleRunEstimate = async () => {
    if (!event) return;
    setIsPreviewLoading(true);
    setError(null);

    try {
      const response = await foodApi.planFood({
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
      });
      setPreviewResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to estimate food metrics from backend.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/waste`);
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/constraints`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={4} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 4 of 6 • Food & Catering</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Food Planning & Waste Prevention
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Configure meal schedules, dietary preferences, and catering costs. The backend Food Module calculates
            servings, costs, and potential food waste based on verified domain assumptions without fake precision.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {/* Global Food Settings */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>General Catering Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="default-diet-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Dietary Preference
              </label>
              <select
                id="default-diet-select"
                value={foodConfig.default_dietary_preference}
                onChange={(e) =>
                  setFoodConfig((prev) => ({
                    ...prev,
                    default_dietary_preference: e.target.value as DietaryPreference,
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                {DIETARY_PREFERENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {foodConfig.default_dietary_preference === 'MIXED' && (
              <div>
                <label htmlFor="veg-ratio-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vegetarian Portion Ratio: {Math.round(Number(foodConfig.vegetarian_ratio) * 100)}%
                </label>
                <input
                  type="range"
                  id="veg-ratio-input"
                  min="0"
                  max="1"
                  step="0.05"
                  value={foodConfig.vegetarian_ratio}
                  onChange={(e) =>
                    setFoodConfig((prev) => ({
                      ...prev,
                      vegetarian_ratio: e.target.value,
                    }))
                  }
                  className="w-full accent-emerald-600 mt-2"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0% (All Non-Veg)</span>
                  <span>70% (Standard College Default)</span>
                  <span>100% (All Veg)</span>
                </div>
              </div>
            )}
          </div>

          {/* Do you know the food cost? */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Do you know your catering / food cost?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {[
                { id: 'ESTIMATE', label: "I don't know — estimate it", desc: 'Use empirical domain assumptions' },
                { id: 'UNIT', label: 'Yes, per person / serving', desc: 'Specify exact cost per portion' },
                { id: 'TOTAL', label: 'Yes, total lump sum', desc: 'Enter overall catering contract' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setFoodConfig((prev) => ({
                      ...prev,
                      costApproach: opt.id as any,
                    }))
                  }
                  className={`text-left p-3.5 rounded-xl border text-xs transition-all focus:outline-none ${
                    foodConfig.costApproach === opt.id
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold">{opt.label}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* If user knows unit cost */}
            {foodConfig.costApproach === 'UNIT' && (
              <div className="flex items-center space-x-3 mt-3 max-w-sm">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={foodConfig.known_unit_cost}
                    onChange={(e) =>
                      setFoodConfig((prev) => ({ ...prev, known_unit_cost: e.target.value }))
                    }
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <select
                  value={foodConfig.cost_pricing_unit}
                  onChange={(e) =>
                    setFoodConfig((prev) => ({ ...prev, cost_pricing_unit: e.target.value as FoodPricingUnit }))
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="PER_PERSON">per person</option>
                  <option value="PER_SERVING">per serving</option>
                </select>
              </div>
            )}

            {/* If user knows total cost */}
            {foodConfig.costApproach === 'TOTAL' && (
              <div className="relative mt-3 max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="25000"
                  value={foodConfig.known_total_cost}
                  onChange={(e) =>
                    setFoodConfig((prev) => ({ ...prev, known_total_cost: e.target.value }))
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Meals List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Scheduled Meals ({foodConfig.meals.length})
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            {foodConfig.meals.map((meal, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                    D{meal.day}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      {meal.name || meal.meal_type}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Type: <strong>{meal.meal_type}</strong> • Dietary: {meal.dietary_preference || 'Default'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeMeal(index)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors focus:outline-none"
                  aria-label="Remove meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Meal Form */}
          <form onSubmit={handleAddMeal} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Meal Course</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div>
                <label htmlFor="new-meal-type-select" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Course Type
                </label>
                <select
                  id="new-meal-type-select"
                  value={newMealType}
                  onChange={(e) => setNewMealType(e.target.value as MealType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  {MEAL_TYPE_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-meal-label-input" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Custom Label
                </label>
                <input
                  type="text"
                  id="new-meal-label-input"
                  placeholder="e.g. Day 1 Lunch"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label htmlFor="new-meal-diet-select" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Dietary Style
                </label>
                <select
                  id="new-meal-diet-select"
                  value={newMealDiet}
                  onChange={(e) => setNewMealDiet(e.target.value as DietaryPreference)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="MIXED">Mixed</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="NON_VEGETARIAN">Non-Veg</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-meal-day-input" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Event Day
                </label>
                <input
                  type="number"
                  id="new-meal-day-input"
                  min="1"
                  max={event?.duration_days || 30}
                  value={newMealDay}
                  onChange={(e) => setNewMealDay(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all focus:outline-none"
                >
                  Add Meal
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Estimation Preview Section */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Food Estimation Evaluation (Backend Query)</h3>
              <p className="text-xs text-slate-500">
                Execute the Food Planning Module to verify calculations and estimated waste prior to master generation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunEstimate}
              disabled={isPreviewLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isPreviewLoading ? 'Estimating...' : 'Calculate Food Estimates'}</span>
            </button>
          </div>

          {previewResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ExplainableMetric
                  label="Total Servings"
                  value={previewResult.total_estimated_servings}
                  unit="portions"
                  sourceType="ESTIMATED"
                  explanation="Based on expected attendees and participation rate assumption."
                />
                <ExplainableMetric
                  label="Estimated Cost"
                  value={previewResult.cost_summary.estimated_total_cost}
                  unit="INR"
                  sourceType={previewResult.cost_summary.cost_status}
                  explanation={`Calculated via ${previewResult.cost_summary.pricing_approach}.`}
                />
                <ExplainableMetric
                  label="Food Waste (kg)"
                  value={previewResult.waste_summary.estimated_waste_kg}
                  unit="kg"
                  sourceType="ESTIMATED"
                  explanation="Estimated using food waste percentage and per-serving weight assumptions."
                  assumptionParam="food_waste_percentage"
                />
                <ExplainableMetric
                  label="Waste Servings"
                  value={previewResult.waste_summary.estimated_waste_servings}
                  unit="servings"
                  sourceType="ESTIMATED"
                  explanation="Portions estimated to remain unconsumed."
                />
              </div>

              {/* Actionable recommendations */}
              {previewResult.recommendations.length > 0 && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">Food Optimization Recommendations:</span>
                  {previewResult.recommendations.map((rec, i) => (
                    <div key={i} className="text-slate-600">
                      <strong>{rec.title}:</strong> {rec.description} (<em>Impact: {rec.impact}</em>)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Constraints</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
          >
            <span>Continue to Waste Planning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
