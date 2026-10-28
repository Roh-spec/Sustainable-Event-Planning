import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Wallet,
  Scale,
  Leaf,
  X,
  AlertCircle,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { ConstraintType } from "../types/constraints";
import { MainPriority } from "../types/planning";
import { PreferenceTag } from "../components/common/PreferenceTag";
import { usePageTitle } from "../hooks/usePageTitle";

const inferCategory = (desc: string): string => {
  const d = desc.toLowerCase();
  if (
    d.includes("plastic") ||
    d.includes("waste") ||
    d.includes("reusable") ||
    d.includes("bottle") ||
    d.includes("plate") ||
    d.includes("cup") ||
    d.includes("cutlery") ||
    d.includes("packaging") ||
    d.includes("disposable") ||
    d.includes("trash")
  ) {
    return "WASTE";
  }
  if (
    d.includes("food") ||
    d.includes("veg") ||
    d.includes("meal") ||
    d.includes("meat") ||
    d.includes("diet") ||
    d.includes("cater") ||
    d.includes("lunch") ||
    d.includes("dinner") ||
    d.includes("breakfast")
  ) {
    return "FOOD";
  }
  if (
    d.includes("budget") ||
    d.includes("cost") ||
    d.includes("money") ||
    d.includes("price")
  ) {
    return "BUDGET";
  }
  return "GENERAL";
};

const inferValue = (desc: string, type: ConstraintType): string | undefined => {
  const d = desc.toUpperCase();
  if (d.includes("PLASTIC") && type === "NOT_ALLOWED")
    return "NO_PLASTIC_BOTTLES";
  if (d.includes("VEG") && type === "REQUIRED") return "VEGETARIAN_OPTIONS";
  if (d.includes("REUSABLE") && (type === "PREFERRED" || type === "REQUIRED"))
    return "REUSABLE_PACKAGING";
  return undefined;
};

export const ConstraintsPage: React.FC = () => {
  usePageTitle("Constraints & Rules · EcoPlan");
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    priority,
    setPriority,
    constraints,
    addConstraint,
    removeConstraint,
  } = usePlanningWizard();

  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [preferenceType, setPreferenceType] =
    useState<ConstraintType>("REQUIRED");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event: ${err.message}`),
      );
    }
  }, [eventId]);

  const priorityOptions: {
    id: MainPriority;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "SAVE_MONEY",
      title: "Save Money",
      description: "Keep event costs as low as possible.",
      icon: Wallet,
    },
    {
      id: "BALANCED",
      title: "Balanced",
      description: "Balance affordability and sustainability.",
      icon: Scale,
    },
    {
      id: "REDUCE_WASTE",
      title: "Reduce Waste",
      description: "Prioritize waste reduction and reusable items.",
      icon: Leaf,
    },
  ];

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description for your preference.");
      return;
    }
    setError(null);

    addConstraint({
      category: inferCategory(description),
      constraint_type: preferenceType,
      description: description.trim(),
      value: inferValue(description, preferenceType),
    });

    setDescription("");
    setPreferenceType("REQUIRED");
    setIsAdding(false);
  };

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/food`);
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(targetId ? `/events/${targetId}/budget` : "/events/new");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={3} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="surface-sheet p-6 sm:p-10">
        {/* Header */}
        <div className="border-b border-line pb-6 mb-8">
          <span className="label-kicker mb-1 block">Step 03 · Limits & Directives</span>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight font-semibold">
            Event Preferences
          </h1>
          <p className="text-ink-muted text-sm mt-1 max-w-2xl leading-relaxed">
            Tell us what matters most. We'll use your preferences to create
            suitable event plans.
          </p>
        </div>

        {/* Section 1: Priority Focus */}
        <section aria-labelledby="priority-heading" className="border-b border-line pb-8 mb-8 space-y-4">
          <div>
            <h2
              id="priority-heading"
              className="block text-xs font-mono font-bold uppercase tracking-wider text-ink"
            >
              What's your main priority? <span className="text-danger-deep">*</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Choose the primary optimization focus for candidate plans.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="priority-heading"
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {priorityOptions.map((opt) => {
              const isSelected = priority === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setPriority(opt.id)}
                  className={`text-left p-4 rounded-control border transition-colors relative focus:outline-none ${
                    isSelected
                      ? "border-moss-800 border-b-4 bg-moss-50/80 text-ink"
                      : "border-line bg-paper-inset/30 hover:bg-paper-inset hover:border-line-strong text-ink"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={isSelected ? "text-moss-800" : "text-ink-muted"}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-moss-800 bg-moss-800"
                          : "border-line-strong bg-paper-raised"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-paper-raised stroke-[3]" />
                      )}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-ink mb-0.5">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed font-sans">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Special Requirements as Ruled Rows */}
        <section aria-labelledby="requirements-heading" className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                id="requirements-heading"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2"
              >
                <span>Any special requirements?</span>
                <span className="text-ink-muted font-normal text-xs normal-case">
                  (Optional)
                </span>
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Add specific rules for your event, such as dietary needs or
                items to avoid.
              </p>
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="btn-ghost text-xs px-3.5 py-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preference</span>
              </button>
            )}
          </div>

          {/* Add Preference Form Card */}
          {isAdding && (
            <div className="bg-paper border border-line p-5 rounded-control mb-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
                <span className="label-kicker">New Rule Directive</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                  className="text-ink-muted hover:text-ink p-1 rounded-control focus:outline-none"
                  aria-label="Close form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-control bg-danger-bg border-l-2 border-danger-deep text-danger-deep text-xs font-mono flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-danger-deep" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddPreference} className="space-y-4">
                <div>
                  <label
                    htmlFor="preference-desc-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1"
                  >
                    Short Description <span className="text-danger-deep">*</span>
                  </label>
                  <input
                    type="text"
                    id="preference-desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Only vegetarian food, or No single-use plastic bottles"
                    className="w-full px-3.5 py-2 rounded-control border border-line text-sm text-ink bg-paper-raised focus:border-moss-700 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
                    How strictly should this be followed?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        type: "REQUIRED" as ConstraintType,
                        label: "Must Have",
                        sub: "Non-negotiable requirement",
                        borderPattern: "border-solid",
                      },
                      {
                        type: "NOT_ALLOWED" as ConstraintType,
                        label: "Avoid",
                        sub: "Must never be included",
                        borderPattern: "border-solid",
                      },
                      {
                        type: "PREFERRED" as ConstraintType,
                        label: "Would Be Nice",
                        sub: "Preferred when feasible",
                        borderPattern: "border-dashed",
                      },
                    ].map((opt) => {
                      const isOptionSelected = preferenceType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setPreferenceType(opt.type)}
                          className={`p-3 rounded-control border text-left transition-colors ${opt.borderPattern} ${
                            isOptionSelected
                              ? "border-moss-800 bg-moss-50 font-bold text-ink"
                              : "border-line bg-paper-raised hover:bg-paper-inset text-ink-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold font-mono uppercase">
                              {opt.label}
                            </span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isOptionSelected
                                  ? "border-moss-800 bg-moss-800"
                                  : "border-line bg-paper"
                              }`}
                            >
                              {isOptionSelected && (
                                <Check className="w-2.5 h-2.5 text-paper-raised" />
                              )}
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-muted block font-sans">
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setError(null);
                    }}
                    className="btn-ghost px-3.5 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Preference</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Requirements List as Ruled Rows */}
          {constraints.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-line rounded-control text-ink-muted text-xs font-mono">
              No special requirements added yet. Click &ldquo;Add Preference&rdquo; above if you have specific rules, or continue without any.
            </div>
          ) : (
            <div className="border-t border-b border-line divide-y divide-line/60">
              {constraints.map((c, index) => {
                return (
                  <div
                    key={index}
                    className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-paper-inset/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <PreferenceTag priority={c.constraint_type} />
                      <span className="text-sm font-medium text-ink truncate">
                        {c.description}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeConstraint(index)}
                      className="text-ink-muted hover:text-danger-deep p-1 rounded-control hover:bg-danger-bg transition-colors focus:outline-none flex-shrink-0"
                      aria-label="Remove preference"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <button type="button" onClick={handleBack} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Budget</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="btn-primary px-7 py-3 text-sm"
          >
            <span>Continue to Food Planning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
