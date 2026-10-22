import React, { useState } from "react";
import {
  Wallet,
  Scale,
  Leaf,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
} from "lucide-react";
import { PlanAlternative, PLANNING_OBJECTIVE_CONFIG } from "../../types";
import { ExplainableMetric } from "../sustainability/ExplainableMetric";
import {
  formatCurrency,
  formatReusablePercentage,
  formatAssumptionKey,
  formatAssumptionValue,
  formatProvenanceLabel,
} from "../../utils/metricFormatting";
import { pulseSelectedPlan } from "../../utils/animations";

interface PlanCardProps {
  plan: PlanAlternative;
  eventBudget?: number | string | null;
  isSelected?: boolean;
  onSelect: (plan: PlanAlternative) => void;
  currency?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  eventBudget,
  isSelected,
  onSelect,
  currency = "INR",
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isSelected && cardRef.current) {
      pulseSelectedPlan(cardRef.current);
    }
  }, [isSelected]);
  const config = PLANNING_OBJECTIVE_CONFIG[plan.planning_objective] || {
    label: plan.name,
    badge: "Alternative",
    icon: "Sparkles",
    description:
      "Deterministic alternative balancing budget, waste and attendee preferences.",
    tagColor: "bg-paper-inset text-ink-muted border-line",
  };

  const estimatedCostNum =
    plan.estimated_cost !== null &&
    plan.estimated_cost !== undefined &&
    plan.estimated_cost !== ""
      ? Number(plan.estimated_cost)
      : null;
  const budgetNum =
    eventBudget !== null && eventBudget !== undefined && eventBudget !== ""
      ? Number(eventBudget)
      : null;

  const isOverBudget =
    estimatedCostNum !== null &&
    budgetNum !== null &&
    estimatedCostNum > budgetNum;
  const budgetDifference =
    estimatedCostNum !== null && budgetNum !== null
      ? budgetNum - estimatedCostNum
      : null;

  const formattedCost = formatCurrency(plan.estimated_cost, currency);

  // Personality styling based on objective
  const getPersonalityStyles = () => {
    if (isSelected) {
      return {
        cardClass:
          "border border-line border-t-4 border-t-moss-800 bg-paper-raised",
        topAccent: "bg-moss-800",
        tagClass: "bg-moss-700 text-paper-raised border-moss-800",
        iconBoxClass: "bg-moss-800 text-moss-100 border border-moss-900",
        kicker: "Selected Alternative",
      };
    }

    switch (plan.planning_objective) {
      case "BUDGET_FOCUSED":
        return {
          cardClass:
            "border border-line hover:border-clay-400 shadow-subtle bg-paper-raised",
          topAccent: "bg-clay-500",
          tagClass: "bg-clay-100 text-clay-800 border-clay-300",
          iconBoxClass: "bg-clay-50 text-clay-700 border border-clay-200",
          kicker: "Cost-First Ledger",
        };
      case "BALANCED":
        return {
          cardClass:
            "border border-line hover:border-moss-400 shadow-subtle bg-paper-raised",
          topAccent: "bg-moss-500",
          tagClass: "bg-moss-100 text-moss-800 border-moss-300",
          iconBoxClass: "bg-moss-50 text-moss-700 border border-moss-200",
          kicker: "Pragmatic Balance",
        };
      case "SUSTAINABILITY_FOCUSED":
        return {
          cardClass:
            "border-2 border-moss-400 hover:border-moss-600 shadow-subtle bg-paper-raised",
          topAccent: "bg-moss-700",
          tagClass:
            "bg-moss-700 text-paper-raised border-moss-800 font-semibold",
          iconBoxClass: "bg-moss-800 text-moss-100 border border-moss-900",
          kicker: "Maximum Circularity",
        };
      default:
        return {
          cardClass:
            "border border-line hover:border-line-strong shadow-subtle bg-paper-raised",
          topAccent: "bg-line-strong",
          tagClass: "bg-paper-inset text-ink-muted border-line",
          iconBoxClass: "bg-paper-inset text-ink-muted border border-line",
          kicker: "Alternative Plan",
        };
    }
  };

  const personality = getPersonalityStyles();

  const getObjectiveIcon = () => {
    switch (plan.planning_objective) {
      case "BUDGET_FOCUSED":
        return <Wallet className="w-5 h-5 text-clay-700" />;
      case "BALANCED":
        return <Scale className="w-5 h-5 text-moss-700" />;
      case "SUSTAINABILITY_FOCUSED":
        return (
          <Leaf
            className={`w-5 h-5 ${isSelected ? "text-moss-100" : "text-moss-100"}`}
          />
        );
      default:
        return <Sparkles className="w-5 h-5 text-ink-muted" />;
    }
  };

  // Metrics mapping
  const hasWasteKg =
    plan.food_metrics?.estimated_waste_kg !== null &&
    plan.food_metrics?.estimated_waste_kg !== undefined &&
    plan.food_metrics?.estimated_waste_kg !== "";
  const hasWasteServings =
    plan.food_metrics?.estimated_waste_servings !== null &&
    plan.food_metrics?.estimated_waste_servings !== undefined &&
    plan.food_metrics?.estimated_waste_servings !== "";

  const foodWasteValue = hasWasteKg
    ? plan.food_metrics!.estimated_waste_kg
    : hasWasteServings
      ? plan.food_metrics!.estimated_waste_servings
      : null;

  const foodWasteUnit = hasWasteKg
    ? "kg"
    : hasWasteServings
      ? "servings"
      : undefined;

  const reusableBadge = formatReusablePercentage(plan.waste_metrics);

  const plasticCount = plan.waste_metrics?.total_plastic_items;
  const isZeroPlastic =
    plasticCount !== null &&
    plasticCount !== undefined &&
    plasticCount !== "" &&
    (plasticCount === 0 || plasticCount === "0" || Number(plasticCount) === 0);
  const plasticBadge = isZeroPlastic ? "Zero Plastic" : undefined;

  // Plain-language explanations (Section A)
  const foodWasteExplanation =
    foodWasteValue !== null
      ? `We estimate how much food may be left uneaten based on the planned meals and expected leftovers (${foodWasteValue} ${foodWasteUnit || "kg"} estimated).`
      : "We estimate how much food may be left uneaten based on the planned meals and expected leftovers.";

  const reusableExplanation =
    plan.waste_metrics?.reusable_packaging_items !== null &&
    plan.waste_metrics?.reusable_packaging_items !== undefined
      ? reusableBadge
        ? `These are serving items expected to be reusable, helping reduce disposable waste (${plan.waste_metrics.reusable_packaging_items} items, ${reusableBadge} reusable).`
        : `These are serving items expected to be reusable, helping reduce disposable waste (${plan.waste_metrics.reusable_packaging_items} items).`
      : "These are serving items expected to be reusable, helping reduce disposable waste.";

  const singleUseExplanation =
    plan.waste_metrics?.single_use_packaging_items !== null &&
    plan.waste_metrics?.single_use_packaging_items !== undefined
      ? `These are disposable serving items expected to be used during the event (${plan.waste_metrics.single_use_packaging_items} items estimated).`
      : "These are disposable serving items expected to be used during the event.";

  const plasticExplanation = isZeroPlastic
    ? "We estimate plastic items such as bottles or cups based on the event size and available assumptions (0 plastic items — plastic-free alternative)."
    : plasticCount !== null && plasticCount !== undefined
      ? `We estimate plastic items such as bottles or cups based on the event size and available assumptions (${plasticCount} items estimated).`
      : "We estimate plastic items such as bottles or cups based on the event size and available assumptions.";

  // Visual spend-vs-waste trade-off calculations
  const spendRatio =
    budgetNum && estimatedCostNum
      ? Math.min(Math.round((estimatedCostNum / budgetNum) * 100), 100)
      : plan.planning_objective === "BUDGET_FOCUSED"
        ? 60
        : plan.planning_objective === "BALANCED"
          ? 78
          : 90;

  let diversionRatio = 50;
  if (
    plan.waste_metrics?.reusable_percentage !== undefined &&
    plan.waste_metrics?.reusable_percentage !== null
  ) {
    const parsed = parseFloat(String(plan.waste_metrics.reusable_percentage));
    diversionRatio =
      parsed <= 1.0 && parsed > 0
        ? Math.round(parsed * 100)
        : Math.round(parsed);
  } else if (reusableBadge) {
    const match = reusableBadge.match(/(\d+)%/);
    if (match) diversionRatio = parseInt(match[1], 10);
  }

  return (
    <div
      ref={cardRef}
      className={`rounded-sheet flex flex-col justify-between transition-all h-full relative overflow-hidden card-hover ${personality.cardClass}`}
    >
      {/* Top Personality Accent Line */}
      <div className={`h-1.5 w-full ${personality.topAccent}`} />

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        {/* Header: Objective Badge & Feasibility */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-control flex-shrink-0 mt-0.5 border ${personality.iconBoxClass}`}
            >
              {getObjectiveIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${personality.tagClass}`}
                >
                  {config.badge}
                </span>
                <span className="label-kicker text-[10px] hidden sm:inline">
                  {personality.kicker}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-ink tracking-tight mt-1">
                {plan.name}
              </h3>
              <p className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {isSelected && (
            <span className="stamp-moss flex-shrink-0">
              Selected
            </span>
          )}
        </div>

        {/* Cost & Budget Status */}
        <div className="bg-paper-inset/40 border border-line rounded-control p-4 mb-4">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Estimated Total Cost
            </span>
            <span className="font-mono text-2xl font-bold text-ink tracking-tight tabular-nums">
              {formattedCost}
            </span>
          </div>

          {budgetNum !== null && (
            <div className="mt-2 pt-2 border-t border-line/70 flex items-center justify-between text-xs">
              <span className="text-ink-muted">Budget Limit:</span>
              {isOverBudget ? (
                <span className="text-clay-700 font-semibold flex items-center space-x-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Deficit of ₹
                    {Math.abs(budgetDifference || 0).toLocaleString()}
                  </span>
                </span>
              ) : (
                <span className="text-moss-700 font-semibold flex items-center space-x-1 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Remaining: ₹{(budgetDifference || 0).toLocaleString()}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visual Spend-vs-Waste Trade-Off Dumbbell Chart */}
        <div className="bg-paper-inset/40 border border-line rounded-control p-3.5 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="label-kicker text-[10px]">
              Spend vs. Circularity Trade-Off
            </span>
            <span className="text-[10px] font-mono text-ink-muted font-semibold">
              {isOverBudget ? "Over Ceiling" : "Within Budget"}
            </span>
          </div>

          <div className="pt-2 pb-1">
            <svg
              viewBox="0 0 300 42"
              className="w-full h-10 overflow-visible"
              aria-label="Trade-off dumbbell chart"
            >
              {/* Axis line */}
              {/* Guideline axis */}
              <line
                x1="20"
                y1="14"
                x2="280"
                y2="14"
                className="stroke-line"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Connecting dumbbell line */}
              <line
                x1={Math.max(30, Math.min(130, spendRatio * 2.2))}
                y1="14"
                x2={Math.min(270, Math.max(170, diversionRatio * 2.6))}
                y2="14"
                className="stroke-ink-muted"
                strokeWidth="2"
              />
              {/* Spend point (Clay = costs more) */}
              <circle
                cx={Math.max(30, Math.min(130, spendRatio * 2.2))}
                cy="14"
                r="5"
                className="fill-clay-700 stroke-paper-raised"
                strokeWidth="2"
              />
              {/* Waste diversion point (Moss = less waste) */}
              <circle
                cx={Math.min(270, Math.max(170, diversionRatio * 2.6))}
                cy="14"
                r="5"
                className="fill-moss-700 stroke-paper-raised"
                strokeWidth="2"
              />
              {/* Delta label on the dumbbell axis line */}
              <text
                x="150"
                y="32"
                textAnchor="middle"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                className="fill-ink-muted"
                fontWeight="600"
              >
                {budgetDifference !== null
                  ? `${isOverBudget ? `+₹${Math.abs(budgetDifference).toLocaleString()} over ceiling` : `₹${budgetDifference.toLocaleString()} under ceiling`} for ${plan.waste_metrics?.single_use_packaging_items ?? 0} disposables`
                  : `Trade-off: ${spendRatio}% ceiling vs ${diversionRatio}% circular`}
              </text>
            </svg>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted pt-1 border-t border-line/50">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-clay-700" />
              Clay = Spend ({spendRatio}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-moss-700" />
              Moss = Circularity ({diversionRatio}%)
            </span>
          </div>
        </div>

        {/* Key Measurable Sustainability Metrics */}
        <div className="mb-4 flex-grow">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="label-kicker text-[11px] flex items-center space-x-1.5">
              <Leaf className="w-3.5 h-3.5 text-moss-600" />
              <span>Measurable Sustainability Indicators</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 items-stretch">
            {/* Food Waste */}
            <ExplainableMetric
              label="Food Waste"
              value={foodWasteValue}
              unit={foodWasteUnit}
              sourceType="ESTIMATED"
              explanation={foodWasteExplanation}
            />

            {/* Reusable Items */}
            <ExplainableMetric
              label="Reusable Items"
              value={plan.waste_metrics?.reusable_packaging_items}
              unit="items"
              badge={reusableBadge}
              sourceType="ESTIMATED"
              explanation={reusableExplanation}
            />

            {/* Single-Use Items */}
            <ExplainableMetric
              label="Single-Use Items"
              value={plan.waste_metrics?.single_use_packaging_items}
              unit="items"
              sourceType="ESTIMATED"
              explanation={singleUseExplanation}
            />

            {/* Plastic Items */}
            <ExplainableMetric
              label="Plastic Items"
              value={plan.waste_metrics?.total_plastic_items}
              unit="items"
              badge={plasticBadge}
              sourceType="ESTIMATED"
              explanation={plasticExplanation}
            />
          </div>
        </div>

        {/* Why this plan? */}
        {plan.explanations && plan.explanations.length > 0 && (
          <div className="p-3 rounded-control bg-moss-50/80 border border-moss-200/80 mb-3 text-xs text-moss-900">
            <span className="font-bold block text-moss-950 mb-0.5">
              Why this plan?
            </span>
            <p className="line-clamp-2 leading-relaxed text-ink-muted">
              {plan.explanations[0]}
            </p>
          </div>
        )}

        {/* Trade-offs */}
        {plan.tradeoffs && plan.tradeoffs.length > 0 && (
          <div className="p-3 rounded-control bg-clay-50/80 border border-clay-200/80 mb-3 text-xs text-clay-950">
            <span className="font-bold block text-clay-900 mb-0.5">
              Important Trade-off:
            </span>
            <p className="line-clamp-2 leading-relaxed text-ink-muted">
              {plan.tradeoffs[0]}
            </p>
          </div>
        )}

        {/* Preferences / Constraints Status */}
        <div className="text-xs text-ink-muted mb-2 flex items-center justify-between">
          <span className="text-ink-muted font-medium">Preferences:</span>
          {plan.constraint_result.feasible ? (
            <span className="text-moss-700 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-moss-600 flex-shrink-0" />
              <span>
                {plan.constraint_result.relaxed_constraints &&
                plan.constraint_result.relaxed_constraints.length > 0
                  ? `Feasible (${plan.constraint_result.relaxed_constraints.length} relaxed)`
                  : "All preferences satisfied"}
              </span>
            </span>
          ) : (
            <span className="text-clay-700 font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Hard constraints violated</span>
            </span>
          )}
        </div>

        {/* Expandable Technical Details Drawer */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-line space-y-3.5 text-xs">
            {/* A preference we couldn't fully meet (Section C) */}
            {plan.constraint_result.relaxed_constraints &&
              plan.constraint_result.relaxed_constraints.length > 0 && (
                <div className="bg-clay-50/90 border border-clay-200/80 rounded-control p-3 text-xs text-clay-950 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-clay-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-clay-700 flex-shrink-0" />
                    <span>A preference we couldn't fully meet</span>
                  </div>
                  <ul className="space-y-2 text-ink-muted">
                    {plan.constraint_result.relaxed_constraints.map(
                      (r, idx) => (
                        <li
                          key={idx}
                          className="bg-paper-raised p-2.5 rounded-control border border-clay-200/60 leading-relaxed"
                        >
                          <p className="font-semibold text-ink">
                            You preferred:{" "}
                            <span className="font-normal text-ink-muted">
                              {r.description}
                            </span>
                          </p>
                          {r.relaxation_reason && (
                            <p className="mt-1 text-ink-muted">
                              <strong className="text-ink">
                                Plan trade-off:
                              </strong>{" "}
                              {r.relaxation_reason}
                            </p>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {/* What we based this estimate on (Section B) */}
            {plan.assumptions_used && plan.assumptions_used.length > 0 && (
              <div className="bg-paper-inset/40 border border-line rounded-control p-3 space-y-2 text-xs">
                <h5 className="font-bold text-ink">
                  What we based this estimate on:
                </h5>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {plan.assumptions_used.map((a, idx) => (
                    <div
                      key={idx}
                      className="bg-paper-raised p-2.5 rounded-control border border-line/70 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-ink block truncate">
                          {formatAssumptionKey(a.parameter)}
                        </span>
                        <span className="text-[11px] text-ink-muted block">
                          {formatProvenanceLabel(a.source_type)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-ink text-right whitespace-nowrap tabular-nums">
                        {formatAssumptionValue(a.value, a.unit, a.parameter)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Sustainability Indicators */}
            {plan.sustainability_metrics &&
              plan.sustainability_metrics.length > 0 && (
                <div className="bg-paper-inset/40 border border-line rounded-control p-3 space-y-2 text-xs">
                  <h5 className="font-bold text-ink">
                    All sustainability indicators:
                  </h5>
                  <ul className="space-y-1.5">
                    {plan.sustainability_metrics.map((m, idx) => (
                      <li
                        key={idx}
                        className="bg-paper-raised p-2.5 rounded-control border border-line/70 flex justify-between items-center text-xs text-ink-muted gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-ink block truncate">
                            {formatAssumptionKey(m.metric_name)}
                          </span>
                          <span className="text-[11px] text-ink-muted block">
                            {formatProvenanceLabel(m.source_type)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-ink whitespace-nowrap tabular-nums">
                          {m.value} {m.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="p-4 sm:p-5 bg-paper-inset/40 border-t border-line rounded-b-sheet flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-ink-muted hover:text-ink py-2 px-3 rounded-control hover:bg-paper-inset transition-colors focus:outline-none"
        >
          <span>{showDetails ? "Hide Details" : "View Details"}</span>
          {showDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect(plan)}
          className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-control text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
            isSelected
              ? "bg-moss-700 text-paper-raised hover:bg-moss-800"
              : "btn-primary bg-moss-600 hover:bg-moss-700 text-paper-raised"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>Selected Plan</span>
            </>
          ) : (
            <span>Select this Plan</span>
          )}
        </button>
      </div>
    </div>
  );
};
