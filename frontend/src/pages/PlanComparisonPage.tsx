import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Columns3,
  CheckCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { PlanAlternative } from "../types/planning";
import { formatReusablePercentage } from "../utils/metricFormatting";
import { usePageTitle } from "../hooks/usePageTitle";
import { Stamp } from "../components/common/Stamp";
import { DumbbellChart } from "../components/comparison/DumbbellChart";

export const PlanComparisonPage: React.FC = () => {
  usePageTitle("Compare Plans · EcoPlan");
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    planningResponse,
    generatePlans,
    isGenerating,
    selectedPlan,
    selectPlan,
  } = usePlanningWizard();

  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId));
    }
  }, [eventId]);

  useEffect(() => {
    if (event && !planningResponse && !isGenerating) {
      generatePlans().catch(() => {});
    }
  }, [event, planningResponse]);

  const plans = planningResponse?.plans || [];
  const eventBudgetNum = event?.budget?.total_budget
    ? Number(event.budget.total_budget)
    : budget.total_budget
      ? Number(budget.total_budget)
      : null;

  const handleSelect = async (plan: PlanAlternative) => {
    const res = await selectPlan(plan);
    setSelectionNotice(res.message);
  };

  const formatCost = (val?: string | number | null) => {
    if (val === null || val === undefined || val === "") return "Not estimated";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: budget.currency || "INR",
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const formatMetric = (val?: string | number | null, unit?: string) => {
    if (val === null || val === undefined || val === "") return "Not available";
    const num = Number(val);
    const displayNum = isNaN(num)
      ? val
      : Number.isInteger(num)
        ? num.toLocaleString()
        : num.toFixed(1);
    return unit ? `${displayNum} ${unit}` : `${displayNum}`;
  };

  const getObjectiveBadgeClass = (objective: string) => {
    switch (objective) {
      case "BUDGET_FOCUSED":
        return "bg-clay-100 text-clay-800 border-clay-300";
      case "BALANCED":
        return "bg-moss-100 text-moss-800 border-moss-300";
      case "SUSTAINABILITY_FOCUSED":
        return "bg-moss-700 text-paper-raised border-moss-800";
      default:
        return "bg-paper-inset text-ink-muted border-line";
    }
  };

  const isRecommended = (p: PlanAlternative) => {
    if (selectedPlan?.plan_id === p.plan_id) return true;
    if (!selectedPlan && (p.planning_objective === "BALANCED" || plans.length === 1)) {
      return true;
    }
    return false;
  };

  const getPlanRatios = (p: PlanAlternative) => {
    const costNum = p.estimated_cost ? Number(p.estimated_cost) : null;
    const spendRatio =
      eventBudgetNum && costNum
        ? Math.min(Math.round((costNum / eventBudgetNum) * 100), 100)
        : p.planning_objective === "BUDGET_FOCUSED"
          ? 60
          : p.planning_objective === "BALANCED"
            ? 78
            : 90;

    let diversionRatio = 50;
    if (
      p.waste_metrics?.reusable_percentage !== undefined &&
      p.waste_metrics?.reusable_percentage !== null
    ) {
      const parsed = parseFloat(String(p.waste_metrics.reusable_percentage));
      diversionRatio =
        parsed <= 1.0 && parsed > 0
          ? Math.round(parsed * 100)
          : Math.round(parsed);
    }
    return { spendRatio, diversionRatio };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/events/${event?.id || eventId}/plans`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans View</span>
        </Link>
      </div>

      <EventSummaryBanner event={event} budget={budget} />

      <div className="surface-sheet p-6 sm:p-10 mb-8">
        <div className="border-b border-line pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-3 border border-line">
            <Columns3 className="w-3.5 h-3.5 text-moss-600" />
            <span>Comparative Trade-Off Analysis</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Side-by-Side Sustainable Plan Comparison
          </h1>
          <p className="text-ink-muted text-sm mt-1.5 max-w-3xl leading-relaxed">
            Compare generated alternatives across budget expenditure, physical
            food waste, single-use vs. reusable packaging items, and constraint
            satisfaction. Evaluate:{" "}
            <strong className="text-ink font-bold">
              "What measurable environmental gains do I achieve if I spend
              more?"
            </strong>
          </p>
        </div>

        {selectionNotice && (
          <div className="mb-6 p-4 rounded-control bg-moss-50 border border-moss-300 text-moss-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-moss-600 flex-shrink-0" />
              <span>{selectionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectionNotice(null)}
              className="text-xs font-bold text-moss-700 hover:text-moss-900 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="p-16 text-center text-ink-muted text-sm border-2 border-dashed border-line rounded-sheet bg-paper-inset/20">
            No plans available to compare. Please navigate back to generate
            plans.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Ledger Table View */}
            <div className="hidden md:block overflow-x-auto rounded-sheet border border-line bg-paper-raised">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-line">
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-ink-muted w-1/4 bg-paper-inset/40 border-r border-line">
                      Evaluation Dimension
                    </th>
                    {plans.map((p) => {
                      const isSel = selectedPlan?.plan_id === p.plan_id;
                      const isRec = isRecommended(p);
                      return (
                        <th
                          key={p.plan_id}
                          className={`py-4 px-5 transition-colors relative ${
                            isRec
                              ? "glass-strong border-t-4 border-t-moss-800 border-x border-moss-700/30 shadow-subtle z-10"
                              : "bg-paper-inset/20 border-r border-line"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getObjectiveBadgeClass(
                                p.planning_objective,
                              )}`}
                            >
                              {p.planning_objective.replace("_", " ")}
                            </span>
                            {isSel ? (
                              <Stamp variant="moss" thump className="text-[9px] py-0.5 px-2">
                                Selected
                              </Stamp>
                            ) : isRec ? (
                              <Stamp variant="faint" className="text-[9px] py-0.5 px-2">
                                Recommended
                              </Stamp>
                            ) : null}
                          </div>
                          <h3 className="font-sans text-sm sm:text-base font-bold text-ink mt-2">
                            {p.name}
                          </h3>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-line text-xs">
                  {/* Category: Financial Dimensions */}
                  <tr className="bg-paper-inset/50 border-y border-line">
                    <td
                      colSpan={plans.length + 1}
                      className="py-2 px-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted"
                    >
                      Financial Dimensions
                    </td>
                  </tr>

                  {/* Row: Estimated Cost */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Estimated Total Cost
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 font-mono font-bold text-ink text-sm border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {formatCost(p.estimated_cost)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Budget Difference */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Budget Headroom / Deficit
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      if (!eventBudgetNum || !p.estimated_cost) {
                        return (
                          <td
                            key={p.plan_id}
                            className={`py-3.5 px-5 text-ink-muted border-r border-line last:border-r-0 ${
                              isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                            }`}
                          >
                            N/A
                          </td>
                        );
                      }
                      const diff = eventBudgetNum - Number(p.estimated_cost);
                      const isOver = diff < 0;
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 font-mono font-semibold border-r border-line last:border-r-0 ${
                            isOver ? "text-clay-700" : "text-moss-700"
                          } ${isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""}`}
                        >
                          {isOver
                            ? `Deficit ₹${Math.abs(diff).toLocaleString()}`
                            : `Remaining ₹${diff.toLocaleString()}`}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Physical Spend vs Waste Trade-Off */}
                  <tr className="bg-paper-inset/30 border-y border-line">
                    <td className="py-3 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      <div className="font-sans text-xs">Spend vs. Circularity</div>
                      <div className="label-kicker text-[9px] text-ink-muted">Barbell Trade-Off</div>
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      const { spendRatio, diversionRatio } = getPlanRatios(p);
                      const costNum = p.estimated_cost ? Number(p.estimated_cost) : null;
                      const diff = eventBudgetNum && costNum ? eventBudgetNum - costNum : null;
                      const isOver = diff !== null && diff < 0;
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3 px-5 border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          <DumbbellChart
                            spendRatio={spendRatio}
                            diversionRatio={diversionRatio}
                            isOverBudget={isOver}
                            compact
                            deltaLabel={
                              diff !== null
                                ? `${isOver ? `+₹${Math.abs(diff).toLocaleString()} over` : `₹${diff.toLocaleString()} left`} • ${p.waste_metrics?.single_use_packaging_items ?? 0} disposables`
                                : `${spendRatio}% ceiling vs ${diversionRatio}% circ`
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category: Waste & Packaging Indicators */}
                  <tr className="bg-paper-inset/50 border-y border-line">
                    <td
                      colSpan={plans.length + 1}
                      className="py-2 px-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted"
                    >
                      Waste & Packaging Indicators
                    </td>
                  </tr>

                  {/* Row: Food Waste */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Estimated Food Waste
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 font-mono font-bold text-ink border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {p.food_metrics?.estimated_waste_kg !== null &&
                          p.food_metrics?.estimated_waste_kg !== undefined
                            ? formatMetric(
                                p.food_metrics.estimated_waste_kg,
                                "kg",
                              )
                            : formatMetric(
                                p.food_metrics?.estimated_waste_servings,
                                "servings",
                              )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Single-Use Items */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Single-Use Packaging
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 font-mono font-medium text-ink-muted border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {formatMetric(
                            p.waste_metrics?.single_use_packaging_items,
                            "items",
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Reusable Items */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Reusable Packaging Items
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      const reusablePctBadge = formatReusablePercentage(
                        p.waste_metrics,
                      );
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 font-mono font-bold text-moss-700 border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {formatMetric(
                            p.waste_metrics?.reusable_packaging_items,
                            "items",
                          )}{" "}
                          {reusablePctBadge && (
                            <span className="text-[11px] text-moss-600 font-sans font-normal">
                              ({reusablePctBadge})
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Plastic Items */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Plastic Waste Items
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      const count = p.waste_metrics?.total_plastic_items;
                      const isZero = count === 0 || count === "0";
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {isZero ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-moss-100 text-moss-800 font-bold border border-moss-200">
                              Zero Plastic
                            </span>
                          ) : (
                            <span className="font-mono text-ink-muted">
                              {formatMetric(count, "items")}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category: Feasibility & Preferences */}
                  <tr className="bg-paper-inset/50 border-y border-line">
                    <td
                      colSpan={plans.length + 1}
                      className="py-2 px-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted"
                    >
                      Feasibility & Preferences
                    </td>
                  </tr>

                  {/* Row: Constraint Result */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Constraint Satisfaction
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {p.constraint_result.feasible ? (
                            <span className="text-moss-700 font-semibold flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5 text-moss-600 flex-shrink-0" />
                              <span>
                                {p.constraint_result.relaxed_constraints
                                  .length === 0
                                  ? "All satisfied"
                                  : `${p.constraint_result.relaxed_constraints.length} relaxed`}
                              </span>
                            </span>
                          ) : (
                            <span className="text-clay-700 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Infeasible</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Relaxed Constraints */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Relaxed Constraints
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 text-ink-muted text-[11px] border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {p.constraint_result.relaxed_constraints.length ===
                          0 ? (
                            <span className="text-ink-muted">None</span>
                          ) : (
                            <ul className="list-disc pl-3 space-y-0.5">
                              {p.constraint_result.relaxed_constraints.map(
                                (rc, i) => (
                                  <li key={i}>{rc.description}</li>
                                ),
                              )}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Key Trade-offs */}
                  <tr className="hover:bg-paper-inset/20 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink border-r border-line bg-paper-inset/10">
                      Key Trade-offs
                    </td>
                    {plans.map((p) => {
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-5 text-ink-muted leading-snug text-[11px] border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/40 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          {p.tradeoffs.length > 0
                            ? p.tradeoffs.join("; ")
                            : "Balanced allocation"}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Selection Action */}
                  <tr className="bg-paper-inset/30 border-t-2 border-line">
                    <td className="py-4 px-5 font-bold text-ink border-r border-line bg-paper-inset/20">
                      Organiser Selection
                    </td>
                    {plans.map((p) => {
                      const isSel = selectedPlan?.plan_id === p.plan_id;
                      const isRec = isRecommended(p);
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-4 px-5 border-r border-line last:border-r-0 ${
                            isRec ? "bg-moss-50/60 border-x border-moss-700/20 relative z-10" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelect(p)}
                            className={`w-full py-2.5 px-4 rounded-control text-xs font-semibold transition-all focus:outline-none flex items-center justify-center space-x-1.5 ${
                              isSel
                                ? "bg-moss-700 text-paper-raised hover:bg-moss-800"
                                : "btn-ghost w-full hover:bg-moss-50"
                            }`}
                          >
                            {isSel ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected Plan</span>
                              </>
                            ) : (
                              <span>Select Plan</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile / Narrow Screen View (swipeable stacked cards, readable at 360px) */}
            <div className="md:hidden">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-3 px-1">
                <span className="label-kicker text-[10px]">Swipe to compare alternatives →</span>
                <span className="font-mono text-[11px] font-semibold">{plans.length} alternatives</span>
              </div>

              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-none">
                {plans.map((p) => {
                  const isSel = selectedPlan?.plan_id === p.plan_id;
                  const isRec = isRecommended(p);
                  const { spendRatio, diversionRatio } = getPlanRatios(p);
                  const costNum = p.estimated_cost ? Number(p.estimated_cost) : null;
                  const diff = eventBudgetNum && costNum ? eventBudgetNum - costNum : null;
                  const isOver = diff !== null && diff < 0;

                  return (
                    <div
                      key={p.plan_id}
                      className={`snap-center shrink-0 w-[84vw] max-w-[320px] p-4 sm:p-5 rounded-sheet border transition-all ${
                        isRec
                          ? "glass-strong border-t-4 border-t-moss-800 border-moss-700/40 shadow-subtle"
                          : "border-line bg-paper-raised shadow-subtle"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getObjectiveBadgeClass(
                            p.planning_objective,
                          )}`}
                        >
                          {p.planning_objective.replace("_", " ")}
                        </span>
                        {isSel ? (
                          <Stamp variant="moss" thump className="text-[10px] py-0.5 px-2">
                            Active Selected
                          </Stamp>
                        ) : isRec ? (
                          <Stamp variant="faint" className="text-[10px] py-0.5 px-2">
                            Recommended
                          </Stamp>
                        ) : null}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-ink mb-3">
                        {p.name}
                      </h3>

                      {/* Dumbbell Chart in Mobile Card */}
                      <div className="p-2.5 rounded-control bg-paper-inset/40 border border-line mb-3">
                        <span className="label-kicker text-[9px] block mb-1">
                          Spend vs Circularity
                        </span>
                        <DumbbellChart
                          spendRatio={spendRatio}
                          diversionRatio={diversionRatio}
                          isOverBudget={isOver}
                          compact
                          deltaLabel={
                            diff !== null
                              ? `${isOver ? `+₹${Math.abs(diff).toLocaleString()}` : `₹${diff.toLocaleString()} left`}`
                              : `${spendRatio}% ceiling`
                          }
                        />
                      </div>

                      <div className="space-y-2 text-xs divide-y divide-line">
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Estimated Cost:</span>
                          <span className="font-mono font-bold text-ink tabular-nums">
                            {formatCost(p.estimated_cost)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Budget Difference:</span>
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              isOver ? "text-clay-700" : "text-moss-700"
                            }`}
                          >
                            {diff === null
                              ? "N/A"
                              : isOver
                                ? `Deficit ₹${Math.abs(diff).toLocaleString()}`
                                : `Remaining ₹${diff.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Food Waste:</span>
                          <span className="font-mono font-bold text-ink tabular-nums">
                            {p.food_metrics?.estimated_waste_kg !== null &&
                            p.food_metrics?.estimated_waste_kg !== undefined
                              ? formatMetric(p.food_metrics.estimated_waste_kg, "kg")
                              : formatMetric(p.food_metrics?.estimated_waste_servings, "servings")}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Single-use Items:</span>
                          <span className="font-mono font-bold text-ink tabular-nums">
                            {formatMetric(p.waste_metrics?.single_use_packaging_items, "items")}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Reusable Items:</span>
                          <span className="font-mono font-bold text-moss-700 tabular-nums">
                            {formatMetric(p.waste_metrics?.reusable_packaging_items, "items")}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-ink-muted">Plastic Items:</span>
                          <span className="font-mono font-bold text-ink tabular-nums">
                            {formatMetric(p.waste_metrics?.total_plastic_items, "items")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleSelect(p)}
                          className={`w-full py-2.5 px-4 rounded-control text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                            isSel
                              ? "bg-moss-700 text-paper-raised hover:bg-moss-800"
                              : "btn-ghost w-full"
                          }`}
                        >
                          {isSel ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Selected Plan</span>
                            </>
                          ) : (
                            <span>Select Plan</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
