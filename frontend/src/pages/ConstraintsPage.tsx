import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import { ConstraintBase, ConstraintType, CONSTRAINT_TYPE_CONFIG } from '../types/constraints';

export const ConstraintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loadEvent, budget, constraints, addConstraint, removeConstraint } = usePlanningWizard();

  const [category, setCategory] = useState<'FOOD' | 'WASTE' | 'BUDGET' | 'GENERAL'>('WASTE');
  const [constraintType, setConstraintType] = useState<ConstraintType>('NOT_ALLOWED');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) => setError(`Failed to load event: ${err.message}`));
    }
  }, [eventId]);

  const handleAddCustomConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Constraint description cannot be empty.');
      return;
    }
    setError(null);

    addConstraint({
      category,
      constraint_type: constraintType,
      description: description.trim(),
      value: value.trim() || undefined,
    });

    setDescription('');
    setValue('');
  };

  const handleApplyPreset = (preset: ConstraintBase) => {
    addConstraint(preset);
  };

  const presets: { title: string; constraint: ConstraintBase }[] = [
    {
      title: '🚫 Ban Single-Use Plastic Water Bottles',
      constraint: {
        category: 'WASTE',
        constraint_type: 'NOT_ALLOWED',
        description: 'Prohibit single-use plastic water bottles across the event venue',
        value: 'NO_PLASTIC_BOTTLES',
      },
    },
    {
      title: '🥗 Vegetarian Meals Mandatory',
      constraint: {
        category: 'FOOD',
        constraint_type: 'REQUIRED',
        description: 'Vegetarian meal options required for all participants',
        value: 'VEGETARIAN_OPTIONS',
      },
    },
    {
      title: '🍽️ Prefer Reusable Plates & Cutlery',
      constraint: {
        category: 'WASTE',
        constraint_type: 'PREFERRED',
        description: 'Prefer 100% reusable stainless steel or melamine plates where feasible',
        value: 'REUSABLE_PACKAGING',
      },
    },
    {
      title: '🎨 Flexible Decoration Quantities',
      constraint: {
        category: 'WASTE',
        constraint_type: 'FLEXIBLE',
        description: 'Decoration items and banners can be scaled by the planner to meet budget',
        value: 'DECORATION_SCALING',
      },
    },
  ];

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/food`);
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/budget`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={3} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 3 of 6 • Constraints & Rules</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional & Sustainability Constraints
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Configure rules that govern your event planning. Hard constraints (Required & Not Allowed) must never be
            violated, while soft constraints (Preferred & Flexible) guide optimization.
          </p>
        </div>

        {/* Constraint Types Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {(['REQUIRED', 'NOT_ALLOWED', 'PREFERRED', 'FLEXIBLE'] as ConstraintType[]).map((type) => {
            const cfg = CONSTRAINT_TYPE_CONFIG[type];
            return (
              <div key={type} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.pillColor}`} />
                  <span className="font-bold text-xs text-slate-900">{cfg.label}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">{cfg.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Presets */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quick Sustainability Presets (Click to Add)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset.constraint)}
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center justify-between group focus:outline-none"
              >
                <span>{preset.title}</span>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Constraint Builder Form */}
        <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Custom Constraint</span>
          </h3>

          {error && <div className="mb-4 text-xs font-semibold text-rose-600">{error}</div>}

          <form onSubmit={handleAddCustomConstraint} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="constraint-category" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Domain Category
                </label>
                <select
                  id="constraint-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="WASTE">Waste & Packaging</option>
                  <option value="FOOD">Food & Catering</option>
                  <option value="BUDGET">Budget & Finance</option>
                  <option value="GENERAL">General Guidelines</option>
                </select>
              </div>

              <div>
                <label htmlFor="constraint-level" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Enforcement Level
                </label>
                <select
                  id="constraint-level"
                  value={constraintType}
                  onChange={(e) => setConstraintType(e.target.value as ConstraintType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="REQUIRED">Required — Must be satisfied</option>
                  <option value="NOT_ALLOWED">Not Allowed — Must never be violated</option>
                  <option value="PREFERRED">Preferred — Try to satisfy when possible</option>
                  <option value="FLEXIBLE">Flexible — Can be adjusted by planner</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="constraint-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Constraint Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="constraint-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Prohibit plastic water bottles, or Require compostable napkins"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all focus:outline-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Event Constraints</span>
              </button>
            </div>
          </form>
        </div>

        {/* Active Constraints List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Constraints ({constraints.length})
            </h3>
            {constraints.length === 0 && (
              <span className="text-xs text-amber-600">No constraints configured yet</span>
            )}
          </div>

          {constraints.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              No constraints active. Add presets above or create custom rules for your event.
            </div>
          ) : (
            <div className="space-y-2.5">
              {constraints.map((c, index) => {
                const cfg = CONSTRAINT_TYPE_CONFIG[c.constraint_type];
                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${cfg.badgeColor}`}>
                        {cfg.label}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{c.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Category: {c.category}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeConstraint(index)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors focus:outline-none"
                      aria-label="Remove constraint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
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
