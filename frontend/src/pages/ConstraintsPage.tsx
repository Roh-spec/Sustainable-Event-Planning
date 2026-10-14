import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  Plus,
  Trash2,
  Check,
  Wallet,
  Scale,
  Leaf,
  X,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import { ConstraintType } from '../types/constraints';
import { MainPriority } from '../types/planning';

const inferCategory = (desc: string): string => {
  const d = desc.toLowerCase();
  if (
    d.includes('plastic') ||
    d.includes('waste') ||
    d.includes('reusable') ||
    d.includes('bottle') ||
    d.includes('plate') ||
    d.includes('cup') ||
    d.includes('cutlery') ||
    d.includes('packaging') ||
    d.includes('disposable') ||
    d.includes('trash')
  ) {
    return 'WASTE';
  }
  if (
    d.includes('food') ||
    d.includes('veg') ||
    d.includes('meal') ||
    d.includes('meat') ||
    d.includes('diet') ||
    d.includes('cater') ||
    d.includes('lunch') ||
    d.includes('dinner') ||
    d.includes('breakfast')
  ) {
    return 'FOOD';
  }
  if (d.includes('budget') || d.includes('cost') || d.includes('money') || d.includes('price')) {
    return 'BUDGET';
  }
  return 'GENERAL';
};

const inferValue = (desc: string, type: ConstraintType): string | undefined => {
  const d = desc.toUpperCase();
  if (d.includes('PLASTIC') && type === 'NOT_ALLOWED') return 'NO_PLASTIC_BOTTLES';
  if (d.includes('VEG') && type === 'REQUIRED') return 'VEGETARIAN_OPTIONS';
  if (d.includes('REUSABLE') && (type === 'PREFERRED' || type === 'REQUIRED')) return 'REUSABLE_PACKAGING';
  return undefined;
};

const getPreferenceBadge = (type: ConstraintType) => {
  switch (type) {
    case 'REQUIRED':
      return {
        label: 'Must Have',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'NOT_ALLOWED':
      return {
        label: 'Avoid',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    case 'PREFERRED':
      return {
        label: 'Would Be Nice',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'FLEXIBLE':
      return {
        label: 'Flexible',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    default:
      return {
        label: type,
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      };
  }
};

export const ConstraintsPage: React.FC = () => {
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
  const [description, setDescription] = useState('');
  const [preferenceType, setPreferenceType] = useState<ConstraintType>('REQUIRED');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) => setError(`Failed to load event: ${err.message}`));
    }
  }, [eventId]);

  const priorityOptions: {
    id: MainPriority;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'SAVE_MONEY',
      title: 'Save Money',
      description: 'Keep event costs as low as possible.',
      icon: Wallet,
    },
    {
      id: 'BALANCED',
      title: 'Balanced',
      description: 'Balance affordability and sustainability.',
      icon: Scale,
    },
    {
      id: 'REDUCE_WASTE',
      title: 'Reduce Waste',
      description: 'Prioritize waste reduction and reusable items.',
      icon: Leaf,
    },
  ];

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please enter a description for your preference.');
      return;
    }
    setError(null);

    addConstraint({
      category: inferCategory(description),
      constraint_type: preferenceType,
      description: description.trim(),
      value: inferValue(description, preferenceType),
    });

    setDescription('');
    setPreferenceType('REQUIRED');
    setIsAdding(false);
  };

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/food`);
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(targetId ? `/events/${targetId}/budget` : '/events/new');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={3} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 3 of 6 • Event Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Preferences
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Tell us what matters most. We'll use your preferences to create suitable event plans.
          </p>
        </div>

        {/* Section 1: What's your main priority? */}
        <section aria-labelledby="priority-heading" className="mb-10">
          <div className="mb-4">
            <h2 id="priority-heading" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              What's your main priority? <span className="text-rose-500">*</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the primary focus for your event plans. You can select one priority.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="priority-heading"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                  className={`text-left p-5 rounded-2xl border-2 transition-all relative focus:outline-none ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 mb-1">{opt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Any special requirements? */}
        <section aria-labelledby="requirements-heading" className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2
                id="requirements-heading"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2"
              >
                <span>Any special requirements?</span>
                <span className="text-slate-400 font-normal text-xs normal-case">(Optional)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add specific rules for your event, such as dietary needs or items to avoid.
              </p>
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm focus:outline-none self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preference</span>
              </button>
            )}
          </div>

          {/* Add Preference Form Card */}
          {isAdding && (
            <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>New Preference</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none"
                  aria-label="Close form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddPreference} className="space-y-4">
                <div>
                  <label
                    htmlFor="preference-desc-input"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Short Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="preference-desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Only vegetarian food, or No single-use plastic bottles"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    How strictly should this be followed?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        type: 'REQUIRED' as ConstraintType,
                        label: 'Must Have',
                        sub: 'Non-negotiable requirement',
                      },
                      {
                        type: 'NOT_ALLOWED' as ConstraintType,
                        label: 'Avoid',
                        sub: 'Must never be included',
                      },
                      {
                        type: 'PREFERRED' as ConstraintType,
                        label: 'Would Be Nice',
                        sub: 'Preferred when feasible',
                      },
                    ].map((opt) => {
                      const isOptionSelected = preferenceType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setPreferenceType(opt.type)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isOptionSelected
                              ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isOptionSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                              }`}
                            >
                              {isOptionSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Preference</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Preferences List */}
          {constraints.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              No special requirements added yet. Click &ldquo;Add Preference&rdquo; above if you have specific rules, or continue without any.
            </div>
          ) : (
            <div className="space-y-2.5">
              {constraints.map((c, index) => {
                const badge = getPreferenceBadge(c.constraint_type);
                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${badge.badgeColor}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {c.description}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeConstraint(index)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors focus:outline-none flex-shrink-0"
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

        {/* Navigation buttons */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Budget</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
          >
            <span>Continue to Food Planning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
